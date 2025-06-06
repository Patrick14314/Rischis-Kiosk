const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY
);

router.get('/', async (req, res) => {
  let role = null;
  const token = req.cookies['sb-access-token'];
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      role = profile?.role || null;
    }
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('price', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const sanitized = data.map(p => {
    if (role !== 'admin') delete p.purchase_price;
    return p;
  });

  res.json(sanitized);
});

module.exports = router;
