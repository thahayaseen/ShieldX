import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('WARNING: SUPABASE_URL and SUPABASE_ANON_KEY are not set in the environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
