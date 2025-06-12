import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { playPokerRound } from '../services/pokerService.js';
import supabase from '../utils/supabase.js';

const router = express.Router();

const messages = {
  loss: [
    '🙈 Leider verloren! Dein Einsatz ist weg.',
    '😢 Pech gehabt, vielleicht nächstes Mal!',
    '👎 Das war nichts – versuch es nochmal!',
  ],
  win: [
    '🎉 Gewonnen! Dein Einsatz hat sich verdoppelt!',
    '🥳 Glückwunsch zum Sieg! +100%!',
  ],
  jackpot: [
    '🔥 JACKPOT! Unglaublich!',
    '💥 Was für ein Treffer! Jackpot!',
    '✨ Du räumst richtig ab – Jackpot!',
  ],
};

function randomMessage(type) {
  const arr = messages[type] || [];
  return arr[Math.floor(Math.random() * arr.length)] || '';
}

async function getStats(userId) {
  const [{ count: total }, { count: wins }, { count: jackpots }] =
    await Promise.all([
      supabase
        .from('poker_rounds')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('poker_rounds')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('result', 'loss'),
      supabase
        .from('poker_rounds')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('result', 'jackpot'),
    ]);

  const gamesPlayed = total || 0;
  const winRate = gamesPlayed
    ? `${(((wins || 0) / gamesPlayed) * 100).toFixed(1)}%`
    : '0%';
  return {
    gamesPlayed,
    winRate,
    jackpots: jackpots || 0,
  };
}

router.post(
  '/play',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const amount = parseFloat(req.body.bet);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Ungültiger Einsatz' });
    }

    const round = await playPokerRound(userId, amount);

    const stats = await getStats(userId);

    const message = randomMessage(
      round.result === 'jackpot' ? 'jackpot' : round.result,
    );
    const sound =
      round.result === 'loss'
        ? 'lose.mp3'
        : round.result === 'win'
          ? 'win.mp3'
          : 'jackpot.mp3';

    const response = {
      result: round.result,
      message:
        `${message} ${round.multiplier > 1 ? `Du hast das ${round.multiplier}-FACHE gewonnen!` : ''}`.trim(),
      balance: round.balance,
      multiplier: round.multiplier,
      sound,
      stats,
    };

    const delay = Math.random() * 2000 + 1000; // 1-3s
    await new Promise((resolve) => setTimeout(resolve, delay));

    res.json(response);
  }),
);

export default router;
