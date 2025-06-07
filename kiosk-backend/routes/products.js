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

  const sort = req.query.sort || 'price_asc';

  let query = supabase.from('products').select('*');
  if (sort === 'price_desc') {
    query = query.order('price', { ascending: false });
  } else if (sort === 'name_asc') {
    query = query.order('name', { ascending: true });
  } else if (sort === 'name_desc') {
    query = query.order('name', { ascending: false });
  } else {
    // Default: price ascending
    query = query.order('price', { ascending: true });
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });

  const sanitized = data.map((p) => {
    if (role !== 'admin') delete p.purchase_price;
    return p;
  });

  res.json(sanitized);
});

export default router;
