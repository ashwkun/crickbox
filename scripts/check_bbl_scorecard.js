const WISDEN_API = 'https://cricket-proxy.boxboxcric.workers.dev/?url=';
const CLIENT_SCORECARD = '430fdd0d';
const CLIENT_MATCHES = 'e656463796'; // Matches client ID

async function fetchJson(targetUrl) {
    const proxyUrl = `${WISDEN_API}${encodeURIComponent(targetUrl)}`;
    console.log('Fetching:', targetUrl);
    try {
        const res = await fetch(proxyUrl);
        if (!res.ok) {
            console.error('HTTP Error:', res.status, res.statusText);
            return null;
        }
        return await res.json();
    } catch (e) {
        console.error('Fetch Error:', e);
        return null;
    }
}

// Fetch a recent BBL match first to get an ID
async function fetchBBLMatch() {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 15); // Last 15 days

    // Format dates DDMMYYYY
    const d1 = String(past.getDate()).padStart(2, '0') + String(past.getMonth() + 1).padStart(2, '0') + past.getFullYear();
    const d2 = String(today.getDate()).padStart(2, '0') + String(today.getMonth() + 1).padStart(2, '0') + today.getFullYear();

    // Use CLIENT_MATCHES for list
    const listUrl = `https://www.wisden.com/default.aspx?methodtype=3&client=${CLIENT_MATCHES}&sport=1&league=0&timezone=0530&language=en&daterange=${d1}-${d2}`;

    console.log('Fetching Match List...');
    const listData = await fetchJson(listUrl);

    if (!listData || !listData.matches) {
        console.error('No matches found (API returned null or empty matches)');
        return;
    }

    // Filter for Big Bash League and Completed (R)
    const bblMatch = listData.matches.find(m =>
        m.series_name &&
        m.series_name.includes('Big Bash League') &&
        (m.event_state === 'R' || m.event_state === 'C')
    );

    if (!bblMatch) {
        console.log('No completed BBL matches found in last 15 days. Looking for ANY completed match for structure check...');
    }

    const targetMatch = bblMatch || listData.matches.find(m => m.event_state === 'R' || m.event_state === 'C');

    if (targetMatch) {
        console.log(`Found Match: ${targetMatch.series_name}`);
        console.log(`Teams: ${targetMatch.teama} vs ${targetMatch.teamb}`);
        console.log(`ID: ${targetMatch.game_id}`);
        await checkScorecard(targetMatch.game_id);
    } else {
        console.error('No completed matches found in list.');
    }
}

async function checkScorecard(gameId) {
    const url = `https://www.wisden.com/cricket/v1/game/scorecard?game_id=${gameId}&lang=en&feed_format=json&client_id=${CLIENT_SCORECARD}`;
    console.log(`\nFetching Scorecard for ${gameId}...`);

    const data = await fetchJson(url);
    if (!data || !data.data || !data.data.Innings) {
        console.error('Invalid scorecard data received:', data ? 'data present' : 'null');
        return;
    }

    console.log('\n--- INNINGS DATA STRUCTURE ---');
    data.data.Innings.forEach((inn, idx) => {
        console.log(`\nInnings ${idx + 1} (${inn.Number}):`);
        console.log(`Batting Team ID: ${inn.Battingteam}`);
        console.log(`Total: ${inn.Total} (Type: ${typeof inn.Total})`);
        console.log(`Wickets: ${inn.Wickets} (Type: ${typeof inn.Wickets})`);
        console.log(`Overs: ${inn.Overs}`);
        console.log(`Total_Balls_Bowled: ${inn.Total_Balls_Bowled}`);
        console.log(`AllotedBalls: ${inn.AllotedBalls}`);
        console.log(`Runrate: ${inn.Runrate}`);
        console.log(`Extras -> Byes: ${inn.Byes}, Legbyes: ${inn.Legbyes}, Wides: ${inn.Wides}, Noballs: ${inn.Noballs}, Penalty: ${inn.Penalty || 0}`);
    });
}

fetchBBLMatch();
