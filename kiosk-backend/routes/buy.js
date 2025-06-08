import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { buyProduct } from '../services/purchaseService.js';
import { validateBuy } from '../middleware/validate.js';
const router = express.Router();

router.post('/', validateBuy, requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { product_id, quantity } = req.body;
    const result = await buyProduct(user.id, product_id, quantity);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
