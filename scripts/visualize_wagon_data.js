const https = require('https');

const gameId = 'inwslw12282025268163';
const innings = 2; // Sri Lanka likely chasing

// Clean ID logic from useCricketData
const matchFile = gameId.replace(/[^a-z0-9]/gi, '');
const url = `https://www.wisden.com/cricket/live/json/${matchFile}_batsman_splits_${innings}.json`;

console.log(`Fetching: ${url}`);

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);

            if (!json.Batsmen) {
                console.log('No Batsmen data found in Innings 2');
                return;
            }

            const batsmen = Object.values(json.Batsmen);
            // Find Kaushini Nuthyangana - trying parts of name
            const targetName = "Nuthyangana";
            const batsman = batsmen.find(b => b.Batsman.includes(targetName) || b.Batsman.includes("Kaushini") || b.Batsman.includes("Nuthy"));

            if (!batsman) {
                console.log(`Batsman ${targetName} not found in Innings 2. All Batsmen:`);
                batsmen.forEach(b => console.log(b.Batsman));
                return;
            }

            console.log(`\n--- Batsman: ${batsman.Batsman} ---`);
            console.log(`Total Shots: ${batsman.Shots ? batsman.Shots.length : 0}`);

            if (batsman.Shots) {
                console.log('\nAll Shots:');
                console.log('Runs | Angle | Distance | Zone');
                console.log('--------------------------------');
                batsman.Shots.forEach(shot => {
                    console.log(`${shot.Runs.padStart(4)} | ${shot.Angle.padStart(5)} | ${shot.Distance.padStart(8)} | ${shot.Zone}`);
                });
            }

        } catch (e) {
            console.error('Error parsing JSON:', e.message);
        }
    });

}).on('error', (err) => {
    console.error('Error fetching data:', err.message);
});
