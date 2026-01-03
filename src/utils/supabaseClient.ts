/**
 * Centralized Supabase Client Configuration
 * 
 * This file exports a single Supabase client instance used across the app.
 * The anon key is safe to expose - it only allows public reads via RLS.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ycumznofytwntinxlxkc.supabase.co';
const SUPABASE_ANON_KEY = '***REMOVED***';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export the URL for any components that need it
export { SUPABASE_URL };
