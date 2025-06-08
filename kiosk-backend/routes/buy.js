import express from 'express';
import supabase from '../utils/supabase.js';
import getUserFromRequest from '../utils/getUser.js';
import purchaseProduct from '../utils/purchaseProduct.js';
const router = express.Router();

router.post('/', async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });

  const { product_id, quantity } = req.body;
  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Ungültige Eingaben' });
  }

  const { data: dbUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', product_id)
    .single();

  if (!product || product.stock < quantity)
    return res.status(400).json({ error: 'Nicht genügend Bestand' });

  const { error, success } = await purchaseProduct(dbUser, product, quantity);

  if (!success) {
    return res.status(500).json({ error });
  }

  res.json({ success: true });
});

export default router;
