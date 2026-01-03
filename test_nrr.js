const https = require('https');

// 1. Fetch Live Matches to get a valid Series ID
const clientMatches = 'e656463796'; // CLIENT_MATCHES
const clientScorecard = '430fdd0d'; // CLIENT_SCORECARD

const liveUrl = encodeURIComponent(`https://www.wisden.com/default.aspx?methodtype=3&client=${clientMatches}&sport=1&league=0&timezone=0530&language=en&gamestate=4`);

https.get(`https://cricket-proxy.boxboxcric.workers.dev/?url=${liveUrl}`, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            // specific filter for BBL
            const bblMatch = (json.matches || []).find(m => m.series_name && m.series_name.includes("Big Bash"));

            if (bblMatch && bblMatch.series_id) {
                console.log(`Found BBL Series ID: ${bblMatch.series_id} (${bblMatch.series_name})`);
                fetchSeries(bblMatch.series_id);
            } else {
                console.log("No BBL series found in current/recent matches list.");
                // dump first match just to see what we have
                if (json.matches?.[0]) console.log("Sample Match:", json.matches[0].series_name);
            }
        } catch (e) {
            console.error("Live fetch error:", e);
        }
    });
});

function fetchSeries(seriesId) {
    // Try explicit standings endpoint
    const seriesUrl = encodeURIComponent(`https://www.wisden.com/cricket/v1/standings?series_id=${seriesId}&lang=en&feed_format=json&client_id=${clientScorecard}`);
    console.log("Probing Standings API...");
    https.get(`https://cricket-proxy.boxboxcric.workers.dev/?url=${seriesUrl}`, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            try {
                if (res.statusCode !== 200) {
                    console.log(`Standings API failed with status ${res.statusCode}`);
                    console.log(data.substring(0, 200));
                    return;
                }
                const json = JSON.parse(data);
                console.log("Standings Response Keys:", Object.keys(json));
                if (json.data) {
                    console.log("Standings Data:", JSON.stringify(json.data, null, 2).substring(0, 500));
                }
            } catch (e) { console.error("Standings fetch error:", e); }
        });
    });
}
```
