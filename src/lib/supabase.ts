import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
// Prefer service_role key (bypasses RLS) for local dev; fall back to anon key
const supabaseKey = (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_SERVICE_ROLE_KEY. ' +
    'Database features will not work.',
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');
