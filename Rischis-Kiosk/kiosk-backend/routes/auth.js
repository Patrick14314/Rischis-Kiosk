const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Supabase-Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// 🔐 LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return res.status(401).json({ error: 'Login fehlgeschlagen' });
  }

  // Zugriffstoken im Cookie setzen
  res.cookie('sb-access-token', data.session.access_token, {
    httpOnly: true,
    secure: true,             // über HTTPS – für lokal ggf. false setzen
    sameSite: 'none',         // Cookie auch bei CORS-Anfragen senden
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Tage
  });

  res.json({
    message: 'Login erfolgreich',
    user: data.user,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    }
  });
});

// 🆕 LOGIN-STATUS PRÜFEN
router.get('/me', async (req, res) => {
  const token = req.cookies?.['sb-access-token'];

  if (!token) {
    return res.status(401).json({ loggedIn: false });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ loggedIn: false });
    }

    res.json({ loggedIn: true, user: data.user });
  } catch (err) {
    res.status(500).json({ loggedIn: false, error: 'Serverfehler' });
  }
});

// 🧾 REGISTRIEREN
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });

  const user = data?.user;
  if (error || !user) {
    return res.status(400).json({ error: 'Registrierung fehlgeschlagen' });
  }

  // Neuen Benutzer in eigene Tabelle einfügen
  await supabase.from('users').insert({
    id: user.id,
    name: email.split('@')[0],
    email,
    role: 'buyer',
    balance: 0
  });

  res.json({ message: 'Registrierung erfolgreich' });
});

// 🧼 LOGOUT
router.post('/logout', (req, res) => {
  res.clearCookie('sb-access-token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });

  res.json({ message: 'Logout erfolgreich' });
});

module.exports = router;
