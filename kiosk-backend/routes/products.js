import express from 'express';
import supabase from '../utils/supabase.js';
import getUserRole from '../utils/getUserRole.js';
import getUserFromRequest from '../utils/getUser.js';
const router = express.Router();

const SORT_OPTIONS = {
  price_desc: { column: 'price', asc: false },
  price_asc: { column: 'price', asc: true },
  name_desc: { column: 'name', asc: false },
  name_asc: { column: 'name', asc: true },
};

router.get('/', async (req, res) => {
  const user = await getUserFromRequest(req);
  const role = user ? await getUserRole(user.id) : null;

  const { column, asc } =
    SORT_OPTIONS[req.query.sort] || SORT_OPTIONS.price_asc;

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
