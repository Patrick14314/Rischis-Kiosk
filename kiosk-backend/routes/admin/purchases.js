// routes/admin/purchases.js
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

// GET Kaufverlauf mit optionalem Filter
router.get('/', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });

  const { month, year } = req.query;
  let query = supabase.from('purchases').select('*, product:products(name), user:users(email)').order('created_at', { ascending: false });

  if (month && year) {
    const from = `${year}-${month}-01`;
    const to = new Date(year, month, 0).toISOString().split('T')[0];
    query = query.gte('created_at', from).lte('created_at', to);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
