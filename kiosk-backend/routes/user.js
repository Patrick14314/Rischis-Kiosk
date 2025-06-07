import express from 'express';
import supabase from '../utils/supabase.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const token = req.cookies['sb-access-token']; // <- Cookie statt Header
  if (!token) return res.status(401).json({ error: 'Kein Token vorhanden' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Nicht eingeloggt' });

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Nutzer nicht gefunden' });

  const { data: session } = await supabase
    .from('user_sessions')
    .select('online')
    .eq('user_id', user.id)
    .single();

  res.json({ ...data, online: session?.online || false });
});

export default router;
