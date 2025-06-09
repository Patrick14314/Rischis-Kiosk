import express from 'express';
import { randomUUID } from 'node:crypto';
import supabase from '../utils/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateBuzzerRound } from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// -----------------------
// Simple Server-Sent Events setup
// -----------------------
let sseClients = [];

function broadcastBuzz() {
  const msg = `event: buzz\ndata: buzz\n\n`;
  sseClients.forEach((client) => client.write(msg));
}

router.get('/events', requireAuth, (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  });
  res.flushHeaders();

  sseClients.push(res);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c !== res);
  });
});

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

router.get(
  '/leaderboard',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .maybeSingle();
    if (!round) return res.status(404).json({ leaderboard: [] });
    const { data, error } = await supabase
      .from('buzzer_participants')
      .select('user_id, score, users(name)')
      .eq('round_id', round.id)
      .order('score', { ascending: false });
    if (error) return res.status(500).json({ error: 'Datenbankfehler' });
    res.json({ leaderboard: data });
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
      return res.status(500).json({
        error: 'Runde konnte nicht erstellt werden',
        detail: existingError.message,
      });
    }

    if (existing)
      return res.status(400).json({ error: 'Es läuft bereits eine Runde' });

    const { data, error } = await supabase
      .from('buzzer_rounds')
      .insert({
        id: randomUUID(),
        bet,
        points_limit,
        active: true,
        joinable: true,
      })
      .select()
      .single();
    if (error) {
      console.error('createRound insert error', error);
      return res.status(500).json({
        error: 'Runde konnte nicht erstellt werden',
        detail: error.message,
      });
    }
    res.json({ round: data });
  }),
);

router.post(
  '/round/end',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .single();

    if (!round) return res.status(404).json({ error: 'Keine aktive Runde' });

    const { error } = await supabase
      .from('buzzer_rounds')
      .update({ active: false })
      .eq('id', round.id);

    if (error)
      return res
        .status(500)
        .json({ error: 'Runde konnte nicht beendet werden' });

    res.json({ ended: true });
  }),
);

router.post(
  '/round/lock',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id, joinable')
      .eq('active', true)
      .single();

    if (!round) return res.status(404).json({ error: 'Keine aktive Runde' });

    if (round.joinable === false)
      return res.status(400).json({ error: 'Runde bereits geschlossen' });

    const { error } = await supabase
      .from('buzzer_rounds')
      .update({ joinable: false })
      .eq('id', round.id);

    if (error)
      return res
        .status(500)
        .json({ error: 'Runde konnte nicht geschlossen werden' });

    res.json({ locked: true });
  }),
);

router.post(
  '/kolo',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .single();

    if (!round) return res.status(400).json({ error: 'Keine aktive Runde' });

    const { data, error } = await supabase
      .from('kolos')
      .insert({ id: randomUUID(), round_id: round.id, active: true })
      .select()
      .single();

    if (error)
      return res
        .status(500)
        .json({ error: 'KOLO konnte nicht gestartet werden' });

    res.json({ kolo: data });
  }),
);

router.post(
  '/kolo/end',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { correct } = req.body ?? {};

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

    const { error: endError } = await supabase
      .from('kolos')
      .update({ active: false })
      .eq('id', kolo.id);

    if (endError)
      return res
        .status(500)
        .json({ error: 'KOLO konnte nicht beendet werden' });

    if (correct) {
      const { data: firstBuzz } = await supabase
        .from('buzzes')
        .select('user_id')
        .eq('kolo_id', kolo.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstBuzz) {
        const { data: participant } = await supabase
          .from('buzzer_participants')
          .select('score')
          .eq('round_id', round.id)
          .eq('user_id', firstBuzz.user_id)
          .single();
        const newScore = (participant?.score || 0) + 1;
        await supabase
          .from('buzzer_participants')
          .update({ score: newScore })
          .eq('round_id', round.id)
          .eq('user_id', firstBuzz.user_id);
      }
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
      .select('id, joinable')
      .eq('active', true)
      .single();
    if (!round) return res.status(400).json({ error: 'Keine aktive Runde' });
    if (round.joinable === false)
      return res.status(400).json({ error: 'Runde ist geschlossen' });
    const { error } = await supabase
      .from('buzzer_participants')
      .insert({ id: randomUUID(), round_id: round.id, user_id: userId });
    if (error)
      return res.status(500).json({ error: 'Teilnahme fehlgeschlagen' });
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
    broadcastBuzz();
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
