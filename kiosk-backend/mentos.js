// routes/mentos.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// Authentifizierung aus Cookie
async function getUserFromCookie(req) {
  const token = req.cookies['sb-access-token'];
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET /api/mentos – Liste laden
router.get('/', async (req, res) => {
  const user = await getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });

  const { data, error } = await supabase
    .from('tracker')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/mentos – Eintrag erstellen
router.post('/', async (req, res) => {
  const user = await getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });

  const profile = await supabase.from('users').select('*').eq('id', user.id).single();
  const name = profile.data?.name || user.email;

  const { data, error } = await supabase.from('tracker').insert({
    user_id: user.id,
    user_name: name
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/mentos/:id – Eintrag löschen
router.delete('/:id', async (req, res) => {
  const user = await getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });

  const { data: entry } = await supabase.from('tracker').select('*').eq('id', req.params.id).single();
  if (!entry || entry.user_id !== user.id) return res.status(403).json({ error: 'Keine Berechtigung' });

  const { error } = await supabase.from('tracker').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
