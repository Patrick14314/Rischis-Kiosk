import express from 'express';
import purchaseProduct from '../../utils/purchaseProduct.js';
import getUserAndProduct from '../../utils/getUserAndProduct.js';
import getUserFromRequest from '../../utils/getUser.js';
import getUserRole from '../../utils/getUserRole.js';
import { validateAdminBuy } from '../../middleware/validate.js';
const router = express.Router();

router.post('/', validateAdminBuy, async (req, res, next) => {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) return res.status(401).json({ error: 'Nicht eingeloggt' });

    const role = await getUserRole(authUser.id);
    if (role !== 'admin') return res.status(403).json({ error: 'Nicht erlaubt' });

    const { user_id, product_id, quantity } = req.body;

    const { user, product } = await getUserAndProduct(user_id, product_id);

    if (!user || !product || product.stock < quantity) {
      return res
        .status(400)
        .json({ error: 'Nicht gen\u00fcgend Bestand oder Nutzer nicht gefunden' });
    }

    const { error, success } = await purchaseProduct(user, product, quantity);

    if (!success) {
      return res.status(500).json({ error });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
