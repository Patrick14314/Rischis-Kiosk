import express from 'express';
import getUserFromRequest from '../utils/getUser.js';
import purchaseProduct from '../utils/purchaseProduct.js';
import getUserAndProduct from '../utils/getUserAndProduct.js';
import { validateBuy } from '../middleware/validate.js';
const router = express.Router();

router.post('/', validateBuy, async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const { product_id, quantity } = req.body;

    const { user: dbUser, product } = await getUserAndProduct(
      user.id,
      product_id,
    );

    if (!product || product.stock < quantity)
      return res.status(400).json({ error: 'Nicht gen\u00fcgend Bestand' });

    const { error, success } = await purchaseProduct(dbUser, product, quantity);

    if (!success) {
      return res.status(500).json({ error });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
