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
    const color = req.body.color;
    if (!bet || bet <= 0) {
      return res.status(400).json({ error: 'Ungültiger Einsatz' });
    }
    if (color !== 'red' && color !== 'black') {
      return res
        .status(400)
        .json({ error: 'Farbe muss rot oder schwarz sein' });
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

    const suits = [
      { name: 'hearts', symbol: '♥', color: 'red' },
      { name: 'diamonds', symbol: '♦', color: 'red' },
      { name: 'clubs', symbol: '♣', color: 'black' },
      { name: 'spades', symbol: '♠', color: 'black' },
    ];
    const ranks = [
      'A',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K',
    ];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];

    const win = suit.color === color;
    const multiplier = win ? 2 : 0;
    const cardSymbol = `${rank}${suit.symbol}`;
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

    res.json({
      win,
      card: { symbol: cardSymbol, color: suit.color },
      newBalance,
    });
  }),
);

export default router;
