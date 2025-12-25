import {
    CLIENT_MATCHES,
    CLIENT_SCORECARD,
    SPORT_ID,
    TIMEZONE,
    LANGUAGE
} from './wisdenConfig';

// CORS Proxy (Cloudflare Worker)
export const CORS_PROXY = "https://cricket-proxy.boxboxcric.workers.dev/?url=";

// Wisden API Endpoints (built using centralized config)
export const WISDEN_MATCHES = `https://www.wisden.com/default.aspx?methodtype=3&client=${CLIENT_MATCHES}&sport=${SPORT_ID}&league=0&timezone=${TIMEZONE}&language=${LANGUAGE}`;
export const WISDEN_SCORECARD = `https://www.wisden.com/cricket/v1/game/scorecard?lang=${LANGUAGE}&feed_format=json&client_id=${CLIENT_SCORECARD}&game_id=`;

// Refresh intervals
export const REFRESH_INTERVAL = 30000;

// Fetch helper with CORS proxy
export const proxyFetch = async (url) => {
    const res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
    return await res.json();
};

