import express from 'express';
import supabase from '../utils/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateBuzzerRound } from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';

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

router.post(
  '/round',
  requireAdmin,
  validateBuzzerRound,
  asyncHandler(async (req, res) => {
    const { bet, points_limit } = req.body;
    const { data: existing } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .maybeSingle();

    if (existing)
      return res.status(400).json({ error: 'Es läuft bereits eine Runde' });

    const { data, error } = await supabase
      .from('buzzer_rounds')
      .insert({ bet, points_limit, active: true })
      .select()
      .single();
    if (error)
      return res
        .status(500)
        .json({ error: 'Runde konnte nicht erstellt werden' });
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
  '/join',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { data: round } = await supabase
      .from('buzzer_rounds')
      .select('id')
      .eq('active', true)
      .single();
    if (!round) return res.status(400).json({ error: 'Keine aktive Runde' });
    const { error } = await supabase
      .from('buzzer_participants')
      .insert({ round_id: round.id, user_id: userId });
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
      .insert({ kolo_id: kolo.id, user_id: userId });
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
      .insert({ kolo_id: kolo.id, user_id: userId });
    if (error) return res.status(500).json({ error: 'Skip fehlgeschlagen' });
    res.json({ skipped: true });
  }),
);

export default router;
