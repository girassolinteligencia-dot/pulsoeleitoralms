import { createClient } from '@supabase/supabase-js';
export { getFotoUrl } from './fotoUrl';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasPublicSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  hasPublicSupabaseConfig ? supabaseUrl! : 'https://placeholder.supabase.co',
  hasPublicSupabaseConfig ? supabaseAnonKey! : 'placeholder-anon-key'
);
