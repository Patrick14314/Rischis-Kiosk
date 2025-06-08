import supabase from './supabase.js';

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
    const err = new Error('Fehler beim Kaufvorgang');
    err.status = 500;
    throw err;
  }

  return { success: true };
}
