// routes/purchases.js
const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// GET /api/purchases?sort=desc|asc|price_asc|price_desc
router.get('/', async (req, res) => {
  const token = req.cookies?.['sb-access-token'];
  if (!token) return res.status(401).json({ error: 'Nicht eingeloggt' });

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return res.status(401).json({ error: 'Ungültiger Token' });

  const sort = req.query.sort || 'desc';
  let query = supabase
    .from('purchases')
    .select('price, quantity, created_at, product_name')
    .eq('user_id', authData.user.id);

  if (sort === 'asc') {
    query = query.order('created_at', { ascending: true });
  } else if (sort === 'price_asc') {
    query = query.order('price', { ascending: true });
  } else if (sort === 'price_desc') {
    query = query.order('price', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

module.exports = router;
