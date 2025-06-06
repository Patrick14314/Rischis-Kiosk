// routes/admin.js
const express = require('express');
const router = express.Router();

const supabaseAdmin = require('../supabaseAdmin'); // <-- sicher!

// Route: GET /api/admin/purchases
router.get('/purchases', async (req, res) => {
  const { month, year } = req.query;

  let fromDate, toDate;
  if (month && year) {
    fromDate = new Date(`${year}-${month}-01`);
    toDate = new Date(fromDate);
    toDate.setMonth(fromDate.getMonth() + 1);
  }

  const query = supabaseAdmin
    .from('purchases')
    .select('created_at, user_name, product_name, price, purchase_price');

  if (fromDate && toDate) {
    query
      .gte('created_at', fromDate.toISOString())
      .lt('created_at', toDate.toISOString());
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Fehler beim Abrufen der Käufe:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

module.exports = router;
