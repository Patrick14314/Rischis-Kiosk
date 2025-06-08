import env from './env.js';

export function getCookieOptions() {
  const options = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }

  return options;
}

export function setAuthCookie(res, token) {
  res.cookie('sb-access-token', token, getCookieOptions());
}

export function clearAuthCookie(res) {
  res.clearCookie('sb-access-token', getCookieOptions());
}
