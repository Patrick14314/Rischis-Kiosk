import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: process.env.LOGIN_WINDOW_MS
    ? parseInt(process.env.LOGIN_WINDOW_MS, 10)
    : 15 * 60 * 1000, // 15 minutes
  max: process.env.LOGIN_MAX_ATTEMPTS
    ? parseInt(process.env.LOGIN_MAX_ATTEMPTS, 10)
    : 5,
  standardHeaders: true,
  legacyHeaders: false,
});
