import supabase from './supabase.js';

export default async function purchaseProduct(user, product, quantity) {
  const total = quantity * product.price;
  const newBalance = (user.balance || 0) - total;

  const [
    { error: purchaseError },
    { error: balanceError },
    { error: stockError },
  ] = await Promise.all([
    supabase.from('purchases').insert({
      user_id: user.id,
      user_name: user.name,
      product_id: product.id,
      product_name: product.name,
      price: total,
      quantity,
    }),
    supabase.from('users').update({ balance: newBalance }).eq('id', user.id),
    supabase
      .from('products')
      .update({ stock: product.stock - quantity })
      .eq('id', product.id),
  ]);

  if (purchaseError || balanceError || stockError) {
    return { error: 'Fehler beim Kaufvorgang' };
  }

  return { success: true };
}
