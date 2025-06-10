import express from 'express';
import supabase from '../utils/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import env from '../utils/env.js';
import { creditBank, debitBank } from '../utils/bank.js';

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
    if (!user) return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    if (user.balance < 0) {
      return res
        .status(400)
        .json({ error: 'Guthaben im Minus. Bitte zuerst bei Rischi zahlen.' });
    }
    if (user.balance < bet) {
      return res.status(400).json({ error: 'Nicht genug Guthaben' });
    }

    const rand = Math.random();
    let multiplier = 0;
    let jackpot = false;
    if (rand < 0.05) {
      multiplier = 4;
      jackpot = true;
    } else if (rand < 0.4) {
      multiplier = 2;
    }

    const win = multiplier > 0;
    let newBalance = user.balance - bet;
    if (win) {
      newBalance += bet * multiplier;
      await debitBank(bet * (multiplier - 1));
    } else {
      await creditBank(bet);
    }

    const { error: upErr } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);
    if (upErr) return res.status(500).json({ error: 'Datenbankfehler' });

    res.json({ win, jackpot, newBalance });
  }),
);

export default router;
