import getUserFromRequest from '../utils/getUser.js';
import getUserRole from '../utils/getUserRole.js';

export async function requireAuth(req, res, next) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      const user = await getUserFromRequest(req);
      if (!user) return res.status(401).json({ error: 'Nicht eingeloggt' });
      req.user = user;
    }
    const role = await getUserRole(req.user.id);
    if (role !== 'admin')
      return res.status(403).json({ error: 'Nicht erlaubt' });
    next();
  } catch (err) {
    next(err);
  }
}
