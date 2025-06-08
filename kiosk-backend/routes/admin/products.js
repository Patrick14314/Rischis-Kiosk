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
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, stock, available, category');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const role = await getUserRole(user.id);
  if (role !== 'admin') return res.status(403).json({ error: 'Nicht erlaubt' });
  const { name, price, purchase_price, stock, category, created_by } = req.body;

  if (
    !name ||
    price === undefined ||
    purchase_price === undefined ||
    stock === undefined ||
    !category ||
    !created_by
  ) {
    return res.status(400).json({ error: 'Fehlende Felder' });
  }

  const { error } = await supabase
    .from('products')
    .insert({
      name,
      price,
      purchase_price,
      stock,
      category,
      available: true,
      created_by,
    });

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ message: 'Produkt gespeichert' });
});

router.put('/:id', async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const role = await getUserRole(user.id);
  if (role !== 'admin') return res.status(403).json({ error: 'Nicht erlaubt' });
  const { id } = req.params;
  const { name, price, stock } = req.body;
  const { error } = await supabase
    .from('products')
    .update({ name, price, stock })
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Produkt aktualisiert' });
});

// Verfügbarkeit eines Produkts umschalten
router.put('/:id/available', async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const role = await getUserRole(user.id);
  if (role !== 'admin') return res.status(403).json({ error: 'Nicht erlaubt' });
  const { id } = req.params;
  const { available } = req.body;
  const { error } = await supabase
    .from('products')
    .update({ available })
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Produkt aktualisiert' });
});

router.delete('/:id', async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const role = await getUserRole(user.id);
  if (role !== 'admin') return res.status(403).json({ error: 'Nicht erlaubt' });
  const { id } = req.params;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
