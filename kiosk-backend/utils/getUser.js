// kiosk-backend/utils/getUser.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

async function getUserFromRequest(req) {
  // Zuerst nach einem Bearer-Token im Authorization-Header suchen
  let token = req.headers['authorization']?.replace('Bearer ', '');

  // Falls kein Header vorhanden ist, das Cookie verwenden
  if (!token) {
    token = req.cookies?.['sb-access-token'];
  }

  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return null;

  return user;
}

module.exports = getUserFromRequest;
