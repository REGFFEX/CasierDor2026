import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

/**
 * Returns true when both Supabase URL and anon key are provided via env.
 * Used to decide whether to use Supabase auth/sync or fall back to local-only mode.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Supabase client — always created so imports don't crash, but only
 * meaningful when `isSupabaseConfigured()` returns true.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'http://localhost',
  supabaseAnonKey || 'dummy'
);
