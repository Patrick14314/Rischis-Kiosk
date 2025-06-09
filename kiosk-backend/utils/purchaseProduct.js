import supabase from './supabase.js';
import env from './env.js';

export default async function purchaseProduct(user, product, quantity) {
  const total = quantity * product.price;

  const { error } = await supabase.rpc('purchase_product', {
    p_user_id: user.id,
    p_user_name: user.name,
    p_product_id: product.id,
    p_product_name: product.name,
    p_price: total,
    p_quantity: quantity,
  });

  if (error) {
    let message = 'Fehler beim Kaufvorgang';
    if (error.message && error.message.includes('purchase_product')) {
      message =
        'Fehlende Funktion purchase_product – SQL unter sql/purchase_product.sql ausführen.';
    }
    const err = new Error(message);
    err.status = 500;
    throw err;
  }

  if (env.BANK_USER_NAME) {
    const { data: bank } = await supabase
      .from('users')
      .select('id, balance')
      .eq('name', env.BANK_USER_NAME)
      .maybeSingle();
    if (bank) {
      await supabase
        .from('users')
        .update({ balance: (bank.balance || 0) + total })
        .eq('id', bank.id);
    }
  }

  return { success: true };
}
