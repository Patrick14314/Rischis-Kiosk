// routes/auth.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// Login-Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return res.status(401).json({ error: 'Login fehlgeschlagen' });
  }

  // Cookie setzen (nur Beispiel, echte Cookies benötigen zusätzliches Handling!)
  res.cookie('sb-access-token', data.session.access_token, {
  httpOnly: true,
  secure: false, // wichtig: FALSE für localhost
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Tage
});


  res.json({ message: 'Login erfolgreich', user: data.user });
});

// Registrieren-Route
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });

  const user = data?.user;
  if (error || !user) {
    return res.status(400).json({ error: 'Registrierung fehlgeschlagen' });
  }

  // User-Datensatz in Tabelle "users" ergänzen
  await supabase.from('users').insert({
    id: user.id,
    name: email.split('@')[0],
    email,
    role: 'buyer',
    balance: 0
  });

  res.json({ message: 'Registrierung erfolgreich' });
});

module.exports = router;
