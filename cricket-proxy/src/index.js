export default {
    async fetch(request, env, ctx) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
            "Access-Control-Max-Age": "86400",
        };

        // Handle OPTIONS (CORS preflight)
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const targetUrl = url.searchParams.get("url");

        if (!targetUrl) {
            return new Response("Missing url param", { status: 400, headers: corsHeaders });
        }

        try {
            // Forward the request to the target URL
            const response = await fetch(targetUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
                }
            });

            // Clone response to read body
            const data = await response.text();

            // Return response with CORS headers
            return new Response(data, {
                status: response.status,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json"
                }
            });
        } catch (e) {
            return new Response(e.message, { status: 500, headers: corsHeaders });
        }
    },
};
