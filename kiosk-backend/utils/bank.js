import supabase from './supabase.js';
import env from './env.js';

/**
 * Credit the bank account identified by BANK_USER_NAME.
 * @param {number} amount Amount to add to the bank balance
 */
export async function creditBank(amount) {
  if (!env.BANK_USER_NAME || !amount || amount <= 0) return;
  const { data: bank } = await supabase
    .from('users')
    .select('id, balance')
    .eq('name', env.BANK_USER_NAME)
    .maybeSingle();
  if (bank) {
    await supabase
      .from('users')
      .update({ balance: (bank.balance || 0) + amount })
      .eq('id', bank.id);
  }
}

/**
 * Debit the bank account identified by BANK_USER_NAME.
 * @param {number} amount Amount to subtract from the bank balance
 */
export async function debitBank(amount) {
  if (!env.BANK_USER_NAME || !amount || amount <= 0) return;
  const { data: bank } = await supabase
    .from('users')
    .select('id, balance')
    .eq('name', env.BANK_USER_NAME)
    .maybeSingle();
  if (bank) {
    await supabase
      .from('users')
      .update({ balance: (bank.balance || 0) - amount })
      .eq('id', bank.id);
  }
}
