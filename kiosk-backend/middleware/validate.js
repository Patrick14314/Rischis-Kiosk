export function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Ungültige Eingaben' });
  }
  next();
}

export function validateRegister(req, res, next) {
  const { email, password } = req.body;
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    password.length < 6
  ) {
    return res.status(400).json({ error: 'Ungültige Eingaben' });
  }
  next();
}

export function validateBuy(req, res, next) {
  const { product_id, quantity } = req.body;
  const pid = parseInt(product_id, 10);
  const qty = parseInt(quantity, 10);
  if (!pid || pid <= 0 || !qty || qty <= 0) {
    return res.status(400).json({ error: 'Ungültige Eingaben' });
  }
  req.body.product_id = pid;
  req.body.quantity = qty;
  next();
}

export function validateAdminBuy(req, res, next) {
  const { user_id } = req.body;
  const uid = parseInt(user_id, 10);
  if (!uid || uid <= 0) {
    return res.status(400).json({ error: "Ung\u00fcltige Eingaben" });
  }
  req.body.user_id = uid;
  validateBuy(req, res, next);
}

