interface Env {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const corsHeaders: Record<string, string> = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, Prefer",
            "Access-Control-Max-Age": "86400",
        };

        // Handle OPTIONS (CORS preflight)
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);

        // ── Supabase Proxy Route: /supabase/* ──
        // Proxies requests to the Supabase REST API
        // e.g. /supabase/rest/v1/contests?select=* → https://<project>.supabase.co/rest/v1/contests?select=*
        if (url.pathname.startsWith("/supabase/")) {
            return handleSupabaseProxy(request, env, url, corsHeaders);
        }

        // ── Legacy Generic Proxy: /?url=<target> ──
        const targetUrl = url.searchParams.get("url");

        if (!targetUrl) {
            return new Response(JSON.stringify({ error: "Missing url param. Use /?url=<target> or /supabase/<path>" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        try {
            const response = await fetch(targetUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
                }
            });

            const data = await response.text();

            return new Response(data, {
                status: response.status,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                    "X-Debug-Url": targetUrl
                }
            });
        } catch (e: any) {
            return new Response(e.message, { status: 500, headers: corsHeaders });
        }
    },
};

/**
 * Handles proxied Supabase requests.
 * Strips /supabase prefix and forwards to the real Supabase URL.
 * Injects the apikey and Authorization headers server-side.
 */
async function handleSupabaseProxy(
    request: Request,
    env: Env,
    url: URL,
    corsHeaders: Record<string, string>
): Promise<Response> {
    // Strip the /supabase prefix to get the real Supabase path
    // e.g. /supabase/rest/v1/contests → /rest/v1/contests
    const supabasePath = url.pathname.replace(/^\/supabase/, "");
    const targetUrl = `${env.SUPABASE_URL}${supabasePath}${url.search}`;

    // Build headers - forward relevant ones from the client, inject auth
    const headers = new Headers();
    headers.set("apikey", env.SUPABASE_ANON_KEY);
    headers.set("Content-Type", "application/json");

    // Forward Authorization header if client sent one (for authenticated users)
    const clientAuth = request.headers.get("Authorization");
    if (clientAuth) {
        headers.set("Authorization", clientAuth);
    } else {
        // Default to anon key for unauthenticated requests
        headers.set("Authorization", `Bearer ${env.SUPABASE_ANON_KEY}`);
    }

    // Forward Prefer header (used for upserts, returning data, etc.)
    const prefer = request.headers.get("Prefer");
    if (prefer) {
        headers.set("Prefer", prefer);
    }

    // Forward x-client-info if present
    const clientInfo = request.headers.get("x-client-info");
    if (clientInfo) {
        headers.set("x-client-info", clientInfo);
    }

    try {
        // Read request body for POST/PUT/PATCH/DELETE
        let body: string | null = null;
        if (request.method !== "GET" && request.method !== "HEAD") {
            body = await request.text();
        }

        const response = await fetch(targetUrl, {
            method: request.method,
            headers,
            body,
        });

        const responseData = await response.text();

        // Forward the response with CORS headers
        const responseHeaders: Record<string, string> = {
            ...corsHeaders,
            "Content-Type": response.headers.get("Content-Type") || "application/json",
        };

        // Forward content-range header (used for pagination)
        const contentRange = response.headers.get("Content-Range");
        if (contentRange) {
            responseHeaders["Content-Range"] = contentRange;
        }

        // Forward the preference-applied header
        const prefApplied = response.headers.get("Preference-Applied");
        if (prefApplied) {
            responseHeaders["Preference-Applied"] = prefApplied;
        }

        return new Response(responseData, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch (e: any) {
        return new Response(
            JSON.stringify({ error: "Supabase proxy error", message: e.message }),
            {
                status: 502,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
}
