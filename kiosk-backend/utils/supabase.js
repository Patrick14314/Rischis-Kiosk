import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error('Supabase credentials not set');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export default supabase;
