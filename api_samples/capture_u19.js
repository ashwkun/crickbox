const fs = require('fs');
const path = require('path');
// Node v18+ has native fetch, no need for node-fetch


// Target Match Game ID (Alphanumeric)
const GAME_ID = 'afupku12272025268833';
// Match ID (Numeric, last 6 digits of Game ID) for Wallstream
const MATCH_ID = '268833';

const OUTPUT_DIR = path.join(__dirname, 'u19');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Config from WisdenConfig
const CLIENT_MATCHES = 'e656463796';
const CLIENT_SCORECARD = '430fdd0d';
const CLIENT_WALLSTREAM = 'lx/QMpdauKZQKYaddAs76w==';
const CORS_PROXY = "https://cricket-proxy.boxboxcric.workers.dev/?url=";

// Construct URLs (Proxied)
// Note: Wallstream needs the client_id encoded
const ENDPOINTS = {
    // 1. Scorecard
    scorecard: `${CORS_PROXY}${encodeURIComponent(`https://www.wisden.com/cricket/v1/game/scorecard?lang=en&feed_format=json&client_id=${CLIENT_SCORECARD}&game_id=${GAME_ID}`)}`,

    // 2. H2H
    h2h: `${CORS_PROXY}${encodeURIComponent(`https://www.wisden.com/cricket/v1/game/head-to-head?client_id=${CLIENT_SCORECARD}&feed_format=json&game_id=${GAME_ID}&lang=en`)}`,

    // 3. Wallstream (Ball-by-ball)
    wallstream: `${CORS_PROXY}${encodeURIComponent(`https://www.wisden.com/functions/wallstream/?sport_id=1&client_id=${encodeURIComponent(CLIENT_WALLSTREAM)}&match_id=${MATCH_ID}&page_size=10&page_no=1&session=1`)}`,

    // 4. Live Match List (Simulating "livematch" by fetching all live and we can inspect)
    livematch: `${CORS_PROXY}${encodeURIComponent(`https://www.wisden.com/default.aspx?methodtype=3&client=${CLIENT_MATCHES}&sport=1&league=0&timezone=0530&language=en&gamestate=1`)}`
};

async function captureData() {
    console.log(`Starting capture for Game ID: ${GAME_ID} / Match ID: ${MATCH_ID}`);

    for (const [key, url] of Object.entries(ENDPOINTS)) {
        try {
            console.log(`Fetching ${key}...`);
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch ${key}: ${response.status} ${response.statusText}`);
                continue;
            }
            const data = await response.json();

            const filePath = path.join(OUTPUT_DIR, `${key}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Saved ${key} to ${filePath}`);

        } catch (error) {
            console.error(`Error capturing ${key}:`, error);
        }
    }
    console.log('Capture complete!');
}

captureData();
