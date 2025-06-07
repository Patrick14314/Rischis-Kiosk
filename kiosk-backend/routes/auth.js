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
  // Token im Cookie speichern. Domain-Angabe entfernen, damit der Cookie
  // direkt an die Backend-Domain gebunden ist und zuverlässig gesendet wird.
  // Cookie sicher setzen. Ohne Domain bleibt er hostgebunden und wird so
  // zuverlässig auch hinter einem Proxy übertragen.
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }
  res.cookie('sb-access-token', data.session.access_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',  // Nur HTTPS in Produktion
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000
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
  // Session-Cookie entfernen. Ohne Domain bleibt der Cookie hostgebunden
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/'
  };
  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }
  res.clearCookie('sb-access-token', cookieOptions);

  res.json({ message: 'Logout erfolgreich' });
});

module.exports = router;
