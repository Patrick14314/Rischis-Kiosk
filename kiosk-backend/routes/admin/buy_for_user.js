import express from 'express';
import supabase from '../../utils/supabase.js';
const router = express.Router();

router.post('/', async (req, res) => {
  const { user_id, product_id, quantity } = req.body;
  if (!user_id || !product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Ungültige Eingaben' });
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id)
    .single();
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', product_id)
    .single();

  if (!user || !product || product.stock < quantity) {
    return res.status(400).json({ error: 'Nicht genügend Bestand oder Nutzer nicht gefunden' });
  }

  const total = quantity * product.price;
  const newBalance = (user.balance || 0) - total;

  const { error: purchaseError } = await supabase.from('purchases').insert({
    user_id: user.id,
    user_name: user.name,
    product_id,
    product_name: product.name,
    price: total,
    quantity
  });
  const { error: balanceError } = await supabase
    .from('users')
    .update({ balance: newBalance })
    .eq('id', user.id);
  const { error: stockError } = await supabase
    .from('products')
    .update({ stock: product.stock - quantity })
    .eq('id', product_id);

  if (purchaseError || balanceError || stockError) {
    return res.status(500).json({ error: 'Fehler beim Kaufvorgang' });
  }

  res.json({ success: true });
});

export default router;
