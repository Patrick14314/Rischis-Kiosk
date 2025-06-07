import express from 'express';
import supabase from '../../utils/supabase.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const { data: users } = await supabase.from('users').select('name, balance');
  const { data: products } = await supabase.from('products').select('id, name, price, purchase_price, stock');
  const { data: purchases } = await supabase.from('purchases').select('product_id, price, quantity');

  const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
  const shopValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);
  const totalRevenue = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
  let totalCost = 0;

  purchases.forEach(p => {
    const product = products.find(x => x.id === p.product_id);
    if (product) totalCost += (product.purchase_price || 0) * (p.quantity || 1);
  });

  const profit = totalRevenue - totalCost;

  res.json({
    users, totalBalance, shopValue, totalRevenue, totalCost, profit
  });
});

router.post('/reset', async (req, res) => {
  const { error: userError } = await supabase
    .from('users')
    .update({ balance: 0 })
    .not('id', 'is', null);

  const { error: purchaseError } = await supabase
    .from('purchases')
    .delete()
    .not('id', 'is', null);

  if (userError || purchaseError) {
    return res.status(500).json({ error: userError?.message || purchaseError?.message });
  }

  res.status(200).json({ message: 'Statistiken zurückgesetzt' });
});

export default router;
