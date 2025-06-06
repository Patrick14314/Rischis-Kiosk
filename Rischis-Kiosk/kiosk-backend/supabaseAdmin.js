const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.warn("⚠️ Weder SUPABASE_SERVICE_ROLE noch SUPABASE_ANON_KEY gesetzt!");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

module.exports = supabaseAdmin;
