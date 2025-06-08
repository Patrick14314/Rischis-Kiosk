import express from 'express';
import supabase from '../../utils/supabase.js';
import getUserFromRequest from '../../utils/getUser.js';
import getUserRole from '../../utils/getUserRole.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const role = await getUserRole(user.id);
  if (role !== 'admin') return res.status(403).json({ error: 'Nicht erlaubt' });
  const [
    { data: users },
    { data: products },
    { data: purchases },
  ] = await Promise.all([
    supabase.from('users').select('name, balance'),
    supabase.from('products').select('id, name, price, purchase_price, stock'),
    supabase.from('purchases').select('product_id, price, quantity'),
  ]);

  const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
  const shopValue = products.reduce(
    (sum, p) => sum + (p.stock || 0) * (p.price || 0),
    0,
  );
  const totalRevenue = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
  let totalCost = 0;
  const productMap = new Map(products.map((p) => [p.id, p]));
  purchases.forEach((purchase) => {
    const product = productMap.get(purchase.product_id);
    if (product)
      totalCost += (product.purchase_price || 0) * (purchase.quantity || 1);
  });

  const profit = totalRevenue - totalCost;

  res.json({
    users,
    totalBalance,
    shopValue,
    totalRevenue,
    totalCost,
    profit,
  });
});

export default router;
