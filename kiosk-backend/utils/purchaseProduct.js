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
    return { error: 'Fehler beim Kaufvorgang' };
  }

  return { success: true };
}
