import express from 'express';
import supabase from '../utils/supabase.js';
import getUserFromRequest from '../utils/getUser.js';
const router = express.Router();

router.post('/', async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });

  const { product_id, quantity } = req.body;
  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Ungültige Eingaben' });
  }


  const { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();
  const { data: product } = await supabase.from('products').select('*').eq('id', product_id).single();

  if (!product || product.stock < quantity) return res.status(400).json({ error: 'Nicht genügend Bestand' });

  const total = quantity * product.price;
  const newBalance = dbUser.balance - total;

  const [
    { error: purchaseError },
    { error: balanceError },
    { error: stockError }
  ] = await Promise.all([
    supabase.from('purchases').insert({
      user_id: dbUser.id,
      user_name: dbUser.name,
      product_id,
      product_name: product.name,
      price: total,
      quantity
    }),
    supabase.from('users').update({ balance: newBalance }).eq('id', dbUser.id),
    supabase.from('products').update({ stock: product.stock - quantity }).eq('id', product_id)
  ]);

  if (purchaseError || balanceError || stockError) {
    return res.status(500).json({ error: 'Fehler beim Kaufvorgang' });
  }

  res.json({ success: true });
});

export default router;
