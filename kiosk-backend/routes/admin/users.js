import express from 'express';
import supabase from '../../utils/supabase.js';
import getUserFromRequest from '../../utils/getUser.js';
import getUserRole from '../../utils/getUserRole.js';
const router = express.Router();

// Liste aller Nutzer
router.get('/', async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const role = await getUserRole(user.id);
  if (role !== 'admin') return res.status(403).json({ error: 'Nicht erlaubt' });
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, balance');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Einzelnen Nutzer laden
router.get('/:id', async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const role = await getUserRole(user.id);
  if (role !== 'admin') return res.status(403).json({ error: 'Nicht erlaubt' });
  const { id } = req.params;
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, balance')
    .eq('id', id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// Name oder Balance aktualisieren
router.put('/:id', async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const role = await getUserRole(user.id);
  if (role !== 'admin') return res.status(403).json({ error: 'Nicht erlaubt' });
  const { id } = req.params;
  const { name, balance } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (balance !== undefined) updates.balance = balance;
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'updated' });
});

// Passwort ändern
router.put('/:id/password', async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
  const role = await getUserRole(user.id);
  if (role !== 'admin') return res.status(403).json({ error: 'Nicht erlaubt' });
  const { id } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Invalid password' });
  }
  const { error } = await supabase.auth.admin.updateUserById(id, { password });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'password updated' });
});

export default router;
