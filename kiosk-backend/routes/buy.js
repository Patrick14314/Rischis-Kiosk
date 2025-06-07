const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

router.post('/', async (req, res) => {
  // Token bevorzugt aus dem Cookie lesen, Fallback auf Authorization-Header
  let token = req.cookies?.['sb-access-token'];
  if (!token) {
    token = req.headers.authorization?.split('Bearer ')[1];
  }
  if (!token) return res.status(401).json({ error: 'Kein Token übergeben' });

  const { product_id, quantity } = req.body;
  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Ungültige Eingaben' });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Nicht eingeloggt' });

  const { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();
  const { data: product } = await supabase.from('products').select('*').eq('id', product_id).single();

  if (!product || product.stock < quantity) return res.status(400).json({ error: 'Nicht genügend Bestand' });

  const total = quantity * product.price;
  const newBalance = dbUser.balance - total;

  const purchaseInsert = await supabase.from('purchases').insert({
    user_id: dbUser.id,
    user_name: dbUser.name,
    product_id,
    product_name: product.name,
    price: total,
    quantity
  });

  const updateBalance = await supabase.from('users').update({ balance: newBalance }).eq('id', dbUser.id);
  const updateStock = await supabase.from('products').update({ stock: product.stock - quantity }).eq('id', product_id);

  if (purchaseInsert.error || updateBalance.error || updateStock.error) {
    return res.status(500).json({ error: 'Fehler beim Kaufvorgang' });
  }

  res.json({ success: true });
});

module.exports = router;
