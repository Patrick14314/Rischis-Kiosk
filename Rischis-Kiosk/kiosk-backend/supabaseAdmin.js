const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

if (!serviceRoleKey) {
  console.warn("⚠️ SUPABASE_SERVICE_ROLE ist nicht gesetzt!");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

module.exports = supabaseAdmin;
