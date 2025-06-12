import express from 'express';
import supabase from '../utils/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import env from '../utils/env.js';

const BANK_USER_NAME = env.BANK_USER_NAME;

const router = express.Router();

router.post(
  '/play',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const bet = parseFloat(req.body.bet);
    if (!bet || bet <= 0) {
      return res.status(400).json({ error: 'Ungültiger Einsatz' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();
    if (error) return res.status(500).json({ error: 'Datenbankfehler' });
    if (!user || (user.balance || 0) < bet) {
      return res.status(400).json({ error: 'Nicht genug Guthaben' });
    }

    const win = Math.random() >= 0.6; // 40% Chance auf Gewinn
    let newBalance = user.balance - bet;
    if (win) {
      newBalance += bet * 2;
    } else if (BANK_USER_NAME) {
      const { data: bank } = await supabase
        .from('users')
        .select('id, balance')
        .eq('name', BANK_USER_NAME)
        .maybeSingle();
      if (bank)
        await supabase
          .from('users')
          .update({ balance: (bank.balance || 0) + bet })
          .eq('id', bank.id);
    }

    const { error: upErr } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);
    if (upErr) return res.status(500).json({ error: 'Datenbankfehler' });

    res.json({ win, newBalance });
  }),
);

export default router;
