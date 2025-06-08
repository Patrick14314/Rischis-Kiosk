import express from 'express';
import supabase from '../utils/supabase.js';
const router = express.Router();

router.get('/', async (req, res) => {
  let role = null;
  const token = req.cookies['sb-access-token'];
  if (token) {
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      role = profile?.role || null;
    }
  }

  const sortOptions = {
    price_desc: { column: 'price', asc: false },
    price_asc: { column: 'price', asc: true },
    name_desc: { column: 'name', asc: false },
    name_asc: { column: 'name', asc: true },
  };
  const { column, asc } = sortOptions[req.query.sort] || sortOptions.price_asc;

  const query = supabase
    .from('products')
    .select('*')
    .order(column, { ascending: asc });

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });

  const sanitized = data.map((p) => {
    if (role !== 'admin') delete p.purchase_price;
    return p;
  });

  res.json(sanitized);
});

export default router;
