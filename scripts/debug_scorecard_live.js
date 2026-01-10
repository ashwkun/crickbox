const CLIENT_SCORECARD = 'e656463796';
const gameId = 'mindcw01102026267688';

const url = `https://www.wisden.com/cricket/v1/game/scorecard/${gameId}?client_id=${CLIENT_SCORECARD}&lang=en`;

console.log('Fetching:', url);

async function run() {
    try {
        const res = await fetch(url);
        const data = await res.json();

        console.log('--- ROOT KEYS ---');
        console.log(Object.keys(data));

        if (data.data && data.data.Matchdetail) {
            console.log('\n--- MATCHDETAIL KEYS ---');
            console.log(Object.keys(data.data.Matchdetail));

            console.log('\n--- PLAYER OF MATCH ---');
            console.log(JSON.stringify(data.data.Matchdetail.Player_Of_The_Match, null, 2));

            console.log('\n--- RESULT ---');
            console.log(data.data.Matchdetail.Result);

            console.log('\n--- MATCH NAME ---');
            console.log(data.data.Matchdetail.Match.Name);

            console.log('\n--- PARTICIPANTS ---');
            // Try to find if player of match is hidden in officials or somewhere
            console.log(JSON.stringify(data.data.Matchdetail.Officials, null, 2));

        } else {
            console.log('No Matchdetail found in data.data');
            console.log('Data dump:', JSON.stringify(data, null, 2).substring(0, 500));
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
