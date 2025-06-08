import express from 'express';
import { randomUUID } from 'node:crypto';
import supabase from '../utils/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateBuzzerRound } from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';

const BANK_EMAIL = 'bank@rischi.de';

const router = express.Router();

router.get(
  '/round',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data: round, error } = await supabase
      .from('buzzer_rounds')
      .select('*')
      .eq('active', true)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: 'Datenbankfehler' });
    }

    if (!round) {
      return res.status(404).json({ round: null });
    }

    res.json({ round });
  }),
);

router.get(
  '/sessions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('username, online, users(role)');
    if (error) return res.status(500).json({ error: 'Datenbankfehler' });
    res.json({ sessions: data });
  }),
);

router.get(
  '/participants',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .maybeSingle();
    if (!round) return res.status(404).json({ participants: [] });
    const { data, error } = await supabase
      .from('buzzer_participants')
      .select('user_id, users(name)')
      .eq('round_id', round.id);
    if (error) return res.status(500).json({ error: 'Datenbankfehler' });
    res.json({ participants: data });
  }),
);

router.post(
  '/round',
  requireAdmin,
  validateBuzzerRound,
  asyncHandler(async (req, res) => {
    const { bet, points_limit } = req.body;
    const { data: existing, error: existingError } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .maybeSingle();

    if (existingError) {
      console.error('createRound existingError', existingError);
      return res
        .status(500)
        .json({ error: 'Runde konnte nicht erstellt werden' });
    }

    if (existing)
      return res.status(400).json({ error: 'Es läuft bereits eine Runde' });

    const { data, error } = await supabase
      .from('buzzer_rounds')
      .insert({ id: randomUUID(), bet, points_limit, active: true })
      .select()
      .single();
    if (error) {
      console.error('createRound insert error', error);
      return res
        .status(500)
        .json({ error: 'Runde konnte nicht erstellt werden' });
    }
    res.json({ round: data });
  }),
);

router.post(
  '/round/end',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const winnerId = req.body?.winner_id;
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id, bet')
      .eq('active', true)
      .single();

    if (!round) return res.status(404).json({ error: 'Keine aktive Runde' });

    const { data: participants, error: partError } = await supabase
      .from('buzzer_participants')
      .select('user_id')
      .eq('round_id', round.id);

    if (partError) return res.status(500).json({ error: 'Datenbankfehler' });

    const { error } = await supabase
      .from('buzzer_rounds')
      .update({ active: false, winner_id: winnerId || null })
      .eq('id', round.id);

    if (error)
      return res
        .status(500)
        .json({ error: 'Runde konnte nicht beendet werden' });

    const pot = round.bet * participants.length;

    if (winnerId) {
      const winner = participants.find((p) => p.user_id === winnerId);
      if (winner) {
        const [{ data: winnerData }, { data: bankUser }] = await Promise.all([
          supabase.from('users').select('balance').eq('id', winnerId).single(),
          supabase
            .from('users')
            .select('id, balance')
            .eq('email', BANK_EMAIL)
            .single(),
        ]);

        const winnerShare = pot * 0.95;
        const bankShare = pot * 0.05;

        await Promise.all([
          supabase
            .from('users')
            .update({ balance: (winnerData.balance || 0) + winnerShare })
            .eq('id', winnerId),
          bankUser &&
            supabase
              .from('users')
              .update({ balance: (bankUser.balance || 0) + bankShare })
              .eq('id', bankUser.id),
        ]);
      }
    } else {
      // refund bet to all participants
      await Promise.all(
        participants.map(async (p) => {
          const { data: user } = await supabase
            .from('users')
            .select('balance')
            .eq('id', p.user_id)
            .single();
          if (user)
            await supabase
              .from('users')
              .update({ balance: (user.balance || 0) + round.bet })
              .eq('id', p.user_id);
        }),
      );
    }

    res.json({ ended: true });
  }),
);

router.post(
  '/join',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id, bet')
      .eq('active', true)
      .single();
    if (!round) return res.status(400).json({ error: 'Keine aktive Runde' });

    const { data: existing } = await supabase
      .from('buzzer_participants')
      .select('id')
      .eq('round_id', round.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) return res.status(400).json({ error: 'Bereits beigetreten' });

    const { data: user } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (!user || user.balance < round.bet)
      return res.status(400).json({ error: 'Zu wenig Guthaben' });

    const { data: participant, error: joinError } = await supabase
      .from('buzzer_participants')
      .insert({ id: randomUUID(), round_id: round.id, user_id: userId })
      .select()
      .single();
    if (joinError)
      return res.status(500).json({ error: 'Teilnahme fehlgeschlagen' });

    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: user.balance - round.bet })
      .eq('id', userId);

    if (balanceError) {
      await supabase
        .from('buzzer_participants')
        .delete()
        .eq('id', participant.id);
      return res
        .status(500)
        .json({ error: 'Guthaben konnte nicht abgezogen werden' });
    }

    res.json({ joined: true });
  }),
);

router.post(
  '/buzz',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .single();
    if (!round) return res.status(400).json({ error: 'Keine aktive Runde' });
    const { data: kolo } = await supabase
      .from('kolos')
      .select('id')
      .eq('round_id', round.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (!kolo) return res.status(400).json({ error: 'Kein aktives KOLO' });
    const { error } = await supabase
      .from('buzzes')
      .insert({ id: randomUUID(), kolo_id: kolo.id, user_id: userId });
    if (error) return res.status(500).json({ error: 'Buzz fehlgeschlagen' });
    res.json({ buzzed: true });
  }),
);

router.post(
  '/skip',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .single();
    if (!round) return res.status(400).json({ error: 'Keine aktive Runde' });
    const { data: kolo } = await supabase
      .from('kolos')
      .select('id')
      .eq('round_id', round.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (!kolo) return res.status(400).json({ error: 'Kein aktives KOLO' });
    const { error } = await supabase
      .from('skips')
      .insert({ id: randomUUID(), kolo_id: kolo.id, user_id: userId });
    if (error) return res.status(500).json({ error: 'Skip fehlgeschlagen' });
    res.json({ skipped: true });
  }),
);

export default router;
