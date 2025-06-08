import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Routen-Imports (nur funktionsfähige Imports!)
import feed from './routes/feed.js';
import products from './routes/products.js';
import buy from './routes/buy.js';
import user from './routes/user.js';
import auth from './routes/auth.js';
import purchases from './routes/purchases.js';
import adminProducts from './routes/admin/products.js';
import adminPurchases from './routes/admin/purchases.js';
import adminStats from './routes/admin/stats.js';
import adminUsers from './routes/admin/users.js';
import adminBuyForUser from './routes/admin/buy_for_user.js';
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, 'public');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(cookieParser());

if (process.env.FORCE_HTTPS === 'true') {
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.originalUrl}`);
    }
    next();
  });
}

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

app.use(csrfProtection);
app.use(express.json());
app.use(express.static(publicDir));

// Statische Routen
['admin', 'dashboard', 'mentos', 'shop'].forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(join(publicDir, `${page}.html`));
  });
});
app.get('/', (req, res) => {
  res.sendFile(join(publicDir, 'index.html'));
});
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// API-Routen
app.use('/api/feedings', feed);
app.use('/api/products', products);
app.use('/api/buy', buy);
app.use('/api/user', user);
app.use('/api/auth', auth);
app.use('/api/purchases', purchases);
app.use('/api/admin/products', adminProducts);
app.use('/api/admin/purchases', adminPurchases);
app.use('/api/admin/stats', adminStats);
app.use('/api/admin/users', adminUsers);
app.use('/api/admin/buy', adminBuyForUser);

// Zentrale Fehlerbehandlung
app.use(errorHandler);

// Server starten
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
