import express from 'express';
import supabase from '../utils/supabase.js';
const router = express.Router();

async function getUser(req) {
  const token = req.cookies['sb-access-token'];
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// Liste der letzten Fütterungen
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('mentos_feedings')
    .select('zeitstempel,futterart,gefuettert_von')
    .order('zeitstempel', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Neue Fütterung eintragen (optional mit Benutzer)
router.post('/', async (req, res) => {
  const user = await getUser(req);
  const { type } = req.body;

  let name = null;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();
    name = profile?.name || user.email;
  }

  const { error } = await supabase.from('mentos_feedings').insert({
    futterart: type,
    gefuettert_von: name,
    zeitstempel: new Date().toISOString()
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Verlauf löschen (nur Admin)
router.delete('/', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Nicht erlaubt' });
  }

  const { error } = await supabase
    .from('mentos_feedings')
    .delete()
    .gt('zeitstempel', '1900-01-01');

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
