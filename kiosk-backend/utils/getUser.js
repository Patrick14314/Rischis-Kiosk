// kiosk-backend/utils/getUser.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

async function getUserFromRequest(req) {
  const token = req.headers['authorization']?.replace('Bearer ', '');

  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return null;

  return user;
}

module.exports = getUserFromRequest;
