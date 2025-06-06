// kiosk-backend/index.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express(); // ✅ Muss vor app.use(...) stehen

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

// Falls du das Frontend lokal servieren willst:
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
// Mentos-Fütterungen
app.use('/feed', require('./routes/feed'));

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend läuft auf https://rischis-kiosk-hdoi.onrender.com:${PORT}`);
});
