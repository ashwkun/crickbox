/**
 * Centralized Supabase Client Configuration
 * 
 * This file exports a single Supabase client instance used across the app.
 * The anon key is safe to expose - it only allows public reads via RLS.
 * 
 * Values loaded from .env file (gitignored)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export the URL for any components that need it
export { SUPABASE_URL };
