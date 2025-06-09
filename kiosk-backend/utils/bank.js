import supabase from './supabase.js';
import env from './env.js';
import logger from './logger.js';

/**
 * Credit the bank account identified by BANK_USER_NAME.
 * @param {number} amount Amount to add to the bank balance
 */
export async function creditBank(amount) {
  if (!env.BANK_USER_NAME || !amount || amount <= 0) {
    logger.warn('creditBank called without BANK_USER_NAME or invalid amount');
    return;
  }
  let { data: bank } = await supabase
    .from('users')
    .select('id, balance')
    .eq('name', env.BANK_USER_NAME)
    .maybeSingle();
  if (!bank) {
    const { data: created, error } = await supabase
      .from('users')
      .insert({ name: env.BANK_USER_NAME, balance: 0, role: 'bank' })
      .select('id, balance')
      .single();
    if (error) {
      logger.error(`Failed to create bank user: ${error.message}`);
      return;
    }
    bank = created;
  }
  await supabase
    .from('users')
    .update({ balance: (bank.balance || 0) + amount })
    .eq('id', bank.id);
}

/**
 * Debit the bank account identified by BANK_USER_NAME.
 * @param {number} amount Amount to subtract from the bank balance
 */
export async function debitBank(amount) {
  if (!env.BANK_USER_NAME || !amount || amount <= 0) {
    logger.warn('debitBank called without BANK_USER_NAME or invalid amount');
    return;
  }
  let { data: bank } = await supabase
    .from('users')
    .select('id, balance')
    .eq('name', env.BANK_USER_NAME)
    .maybeSingle();
  if (!bank) {
    const { data: created, error } = await supabase
      .from('users')
      .insert({ name: env.BANK_USER_NAME, balance: 0, role: 'bank' })
      .select('id, balance')
      .single();
    if (error) {
      logger.error(`Failed to create bank user: ${error.message}`);
      return;
    }
    bank = created;
  }
  await supabase
    .from('users')
    .update({ balance: (bank.balance || 0) - amount })
    .eq('id', bank.id);
}
