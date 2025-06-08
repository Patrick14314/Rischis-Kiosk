// kiosk-backend/utils/getUser.js
import supabase from './supabase.js';

export default async function getUserFromRequest(req) {
  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    req.cookies?.['sb-access-token'];

  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;

  return user;
}
