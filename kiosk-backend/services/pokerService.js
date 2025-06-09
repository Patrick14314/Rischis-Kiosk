import supabase from '../utils/supabase.js';
import { creditBank, debitBank } from '../utils/bank.js';

const outcomePool = [
  ...Array(66).fill(0),
  ...Array(22).fill(2),
  ...Array(6).fill(3),
  ...Array(4).fill(5),
  ...Array(2).fill(10),
];

function pickMultiplier() {
  return outcomePool[Math.floor(Math.random() * outcomePool.length)];
}

function getResultType(multiplier) {
  if (multiplier === 0) return 'loss';
  if (multiplier === 2) return 'win';
  return 'jackpot';
}

export async function playPokerRound(userId, amount) {
  const { data: user, error } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single();

  if (error || !user) {
    const err = new Error('Datenbankfehler');
    err.status = 500;
    throw err;
  }

  if (user.balance < amount || user.balance < 0) {
    const err = new Error('Nicht genug Guthaben');
    err.status = 400;
    throw err;
  }

  const multiplier = pickMultiplier();
  const result = getResultType(multiplier);

  let newBalance = user.balance - amount;
  if (multiplier > 0) {
    newBalance += amount * multiplier;
    await debitBank(amount * (multiplier - 1));
  } else {
    await creditBank(amount);
  }

  const [{ error: upErr }, { error: insertErr }] = await Promise.all([
    supabase.from('users').update({ balance: newBalance }).eq('id', userId),
    supabase.from('poker_rounds').insert({
      user_id: userId,
      amount,
      result,
      multiplier,
    }),
  ]);

  if (upErr || insertErr) {
    const err = new Error('Datenbankfehler');
    err.status = 500;
    throw err;
  }

  return { result, multiplier, balance: newBalance };
}
