const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// ✅ Nur Produktiv-Frontend erlauben
const allowedOrigins = [
  'https://rischis-kiosk-frontend.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// 📁 (optional) Statisches Frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// 🔄 Routen
app.use('/auth', require('./routes/auth'));
app.use('/feed', require('./routes/feed'));
app.use('/api/user', require('./routes/user'));
app.use('/api/products', require('./routes/products'));
app.use('/api/buy', require('./routes/buy'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/products', require('./routes/admin/products'));
app.use('/api/admin/stats', require('./routes/admin/stats'));
app.use('/api/admin/purchases', require('./routes/admin/purchases'));

// 🔐 /auth/me für Loginprüfung
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

app.get('/auth/me', async (req, res) => {
  const token = req.cookies?.['sb-access-token'];

  if (!token) {
    return res.status(401).json({ loggedIn: false });
  }

  try {
    const { data: userData, error } = await supabase.auth.getUser(token);
    if (error || !userData?.user) {
      return res.status(401).json({ loggedIn: false });
    }

    res.json({ loggedIn: true, user: userData.user });
  } catch (err) {
    console.error('Fehler bei /auth/me:', err);
    res.status(500).json({ loggedIn: false });
  }
});

// 🚀 Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend läuft auf Port ${PORT}`);
});
