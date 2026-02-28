/**
 * Centralized Supabase Client Configuration
 * 
 * Routes all Supabase requests through the Cloudflare Worker proxy
 * to bypass India region ISP connectivity issues.
 * 
 * The proxy URL points to our cricket-proxy worker which forwards
 * requests to Supabase from Cloudflare's edge network.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// The Cloudflare Worker proxy URL — all Supabase requests go through here
const PROXY_SUPABASE_URL = 'https://cricket-proxy.boxboxcric.workers.dev/supabase';

// Direct Supabase URL (fallback, kept for reference)
const DIRECT_SUPABASE_URL = process.env.SUPABASE_URL || '';

// The anon key is still needed client-side for auth token generation
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Use the proxy URL so requests route through Cloudflare's edge network
const SUPABASE_URL = PROXY_SUPABASE_URL;

// Wrap fetch with a 10-second timeout to prevent indefinite hangs
const fetchWithTimeout: typeof fetch = (input, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    return fetch(input, { ...init, signal: controller.signal })
        .finally(() => clearTimeout(timeout));
};

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { fetch: fetchWithTimeout },
});

// Export the URL and Key for any components that need to create scoped clients
export { SUPABASE_URL, SUPABASE_ANON_KEY };
