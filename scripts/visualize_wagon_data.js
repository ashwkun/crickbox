const https = require('https');

const gameId = 'inwslw12282025268163';

const fetchInnings = (inn) => {
    const matchFile = gameId.replace(/[^a-z0-9]/gi, '');
    const url = `https://www.wisden.com/cricket/live/json/${matchFile}_batsman_splits_${inn}.json`;

    console.log(`Fetching Innings ${inn}: ${url}`);

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (!json.Batsmen) return;

                console.log(`\n--- INNINGS ${inn} DATA ---`);
                console.log('Player | Runs | Dist | Angle | Zone');

                Object.values(json.Batsmen).forEach(b => {
                    if (b.Shots && b.Shots.length > 0) {
                        b.Shots.forEach(s => {
                            // Only print varying distances to see range
                            console.log(`${b.Batsman.padEnd(15).slice(0, 15)} | ${s.Runs.padStart(4)} | ${s.Distance.padStart(4)} | ${s.Angle.padStart(5)} | ${s.Zone}`);
                        });
                    }
                });
            } catch (e) { console.error(e); }
        });
    });
};

fetchInnings(1);
fetchInnings(2);
