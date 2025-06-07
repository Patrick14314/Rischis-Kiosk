const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'https://rischis-kiosk-hdoi.onrender.com'
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

// Static Frontend (optional)
app.use(express.static(path.join(__dirname, '../frontend')));

// API-Routen
app.use('/api/user', require('./routes/user'));
app.use('/api/products', require('./routes/products'));
app.use('/api/buy', require('./routes/buy'));
app.use('/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/products', require('./routes/admin/products'));
app.use('/api/admin/stats', require('./routes/admin/stats'));
app.use('/api/admin/purchases', require('./routes/admin/purchases'));
app.use('/feed', require('./routes/feed'));

// ➕ NEU: GET /auth/me (direkt hier eingebaut)
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

app.get('/auth/me', async (req, res) => {
  const token = req.cookies?.token;

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
    res.status(500).json({ loggedIn: false });
  }
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend läuft auf https://rischis-kiosk-hdoi.onrender.com:${PORT}`);
});
