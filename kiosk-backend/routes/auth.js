import express from 'express';
import supabase from '../utils/supabase.js';
import { setAuthCookie, clearAuthCookie } from '../utils/authCookies.js';
const router = express.Router();

// 🔐 LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return res.status(401).json({ error: 'Login fehlgeschlagen' });
    }

    setAuthCookie(res, data.session.access_token);

    res.json({
      message: 'Login erfolgreich',
      user: data.user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
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
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });

    const user = data?.user;
    if (error || !user) {
      return res.status(400).json({ error: 'Registrierung fehlgeschlagen' });
    }

    await supabase.from('users').insert({
      id: user.id,
      name: email.split('@')[0],
      email,
      role: 'buyer',
      balance: 0,
    });

    res.json({ message: 'Registrierung erfolgreich' });
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// 🧼 LOGOUT
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logout erfolgreich' });
});

export default router;
