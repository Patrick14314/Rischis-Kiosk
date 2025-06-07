// routes/admin/stats.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

async function getUser(req) {
  const token = req.cookies['sb-access-token'];
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

router.get('/', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });

  try {
    const { data: products, error: productsError } = await supabase.from('products').select('*');
    const { data: purchases, error: purchasesError } = await supabase.from('purchases').select('*');

    if (productsError || purchasesError) {
      return res.status(500).json({ error: 'Fehler beim Laden der Daten' });
    }

    const total_products = products.length;
    const total_stock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const total_value = products.reduce((sum, p) => sum + (p.purchase_price * p.stock || 0), 0);
    const total_revenue = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
    const total_costs = purchases.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
    const total_profit = total_revenue - total_costs;

    res.json({ total_products, total_stock, total_value, total_revenue, total_profit });
  } catch (e) {
    res.status(500).json({ error: 'Interner Fehler bei Statistik' });
  }
});

module.exports = router;
