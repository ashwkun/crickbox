
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Target Match ID from user context (Browser URL)
const MATCH_ID = 'afupku12272025268833';
const OUTPUT_DIR = path.join(__dirname, 'u19');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// API Endpoints
const ENDPOINTS = {
    scorecard: `https://api.cricjs.com/scorecard/${MATCH_ID}`,
    h2h: `https://api.cricjs.com/h2h/${MATCH_ID}`,
    livematch: `https://api.cricjs.com/match/${MATCH_ID}`,
    wallstream: `https://api.cricjs.com/wallstream/${MATCH_ID}`
};

async function captureData() {
    console.log(`Starting capture for Match ID: ${MATCH_ID}`);

    for (const [key, url] of Object.entries(ENDPOINTS)) {
        try {
            console.log(`Fetching ${key}...`);
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch ${key}: ${response.statusText}`);
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
