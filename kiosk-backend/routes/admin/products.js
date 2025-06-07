// routes/admin/products.js
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

// GET alle Produkte
router.get('/', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST neues Produkt
router.post('/', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const { name, price, purchase_price, stock, category } = req.body;
  const { data, error } = await supabase.from('products').insert({ name, price, purchase_price, stock, category, available: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT Produkt bearbeiten
router.put('/:id', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const { id } = req.params;
  const { name, price, purchase_price, stock, category } = req.body;
  const { data, error } = await supabase.from('products').update({ name, price, purchase_price, stock, category }).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT Verfügbarkeit umschalten
router.put('/:id/available', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const { id } = req.params;
  const { available } = req.body;
  const { data, error } = await supabase.from('products').update({ available }).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE Produkt löschen
router.delete('/:id', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const { id } = req.params;

  // Zugehörige Käufe löschen
  const { error: delPurchasesError } = await supabase.from('purchases').delete().eq('product_id', id);
  if (delPurchasesError) return res.status(500).json({ error: delPurchasesError.message });

  const { error: delProductError } = await supabase.from('products').delete().eq('id', id);
  if (delProductError) return res.status(500).json({ error: delProductError.message });

  res.json({ success: true });
});

module.exports = router;
