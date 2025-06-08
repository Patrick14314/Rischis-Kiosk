export function getCookieOptions() {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
}

export function setAuthCookie(res, token) {
  res.cookie('sb-access-token', token, getCookieOptions());
}

export function clearAuthCookie(res) {
  res.clearCookie('sb-access-token', getCookieOptions());
}
