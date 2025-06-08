import express from 'express';
import supabase from '../../utils/supabase.js';
import purchaseProduct from '../../utils/purchaseProduct.js';
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
    return res
      .status(400)
      .json({ error: 'Nicht genügend Bestand oder Nutzer nicht gefunden' });
  }

  const { error, success } = await purchaseProduct(user, product, quantity);

  if (!success) {
    return res.status(500).json({ error });
  }

  res.json({ success: true });
});

export default router;
