// Helper to format date
const formatDate = (date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}${m}${y}`;
};

const CLIENT_MATCHES = 'e656463796';
const SPORT_ID = '1';
const TIMEZONE = '0530';
const LANGUAGE = 'en';

const WISDEN_MATCHES = `https://www.wisden.com/default.aspx?methodtype=3&client=${CLIENT_MATCHES}&sport=${SPORT_ID}&league=0&timezone=${TIMEZONE}&language=${LANGUAGE}`;

async function simulate() {
    const fetch = (await import('node-fetch')).default;
    // 1. Live Fetch
    console.log('Fetching Live (gamestate=1)...');
    const liveUrl = `${WISDEN_MATCHES}&gamestate=1`;
    const liveRes = await fetch(encodeURI(liveUrl));
    const liveData = await liveRes.json();
    const liveMatches = liveData.matches || [];
    console.log(`Live matches: ${liveMatches.length}`);
    const liveAshes = liveMatches.find(m => m.series_name.includes('Ashes'));
    if (liveAshes) console.log('FOUND ASHES IN LIVE:', liveAshes.game_id, liveAshes.event_state);

    // 2. Upcoming Fetch
    console.log('Fetching Upcoming (gamestate=2)...');
    const upcomingUrl = `${WISDEN_MATCHES}&gamestate=2&days=10`;
    const upcomingRes = await fetch(encodeURI(upcomingUrl));
    const upcomingData = await upcomingRes.json();
    const upcomingMatches = upcomingData.matches || [];
    console.log(`Upcoming matches: ${upcomingMatches.length}`);
    const upcomingAshes = upcomingMatches.find(m => m.series_name.includes('Ashes'));
    if (upcomingAshes) console.log('FOUND ASHES IN UPCOMING:', upcomingAshes.game_id, upcomingAshes.event_state);

    // 3. Results Fetch
    console.log('Fetching Results (Last 30 days)...');
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 30);
    const dateRange = `${formatDate(past)}-${formatDate(today)}`;
    const resultsUrl = `${WISDEN_MATCHES}&daterange=${dateRange}`;
    console.log(`URL: ${resultsUrl}`);

    const resultsRes = await fetch(encodeURI(resultsUrl));
    const resultsData = await resultsRes.json();
    const resultMatches = resultsData.matches || [];
    console.log(`Result matches: ${resultMatches.length}`);
    const allAshes = resultMatches.filter(m => m.series_name && m.series_name.includes('Ashes'));
    console.log(`\nFound ${allAshes.length} Ashes matches in results:`);
    allAshes.forEach(m => {
        console.log(`- ${m.event_name} (${m.start_date} to ${m.end_date}) ID: ${m.game_id}`);
    });

    const targetMatch = resultMatches.find(m => m.game_id === 'auen01042026253246');
    if (targetMatch) {
        console.log(`\nTARGET MATCH FOUND: 5th Test (Jan 4-8) - State: ${targetMatch.event_state}`);
    } else {
        console.log(`\nTARGET MATCH MISSING: 5th Test (Jan 4-8) NOT found in results.`);
    }

    const resultAshes = allAshes[0]; // Keep for downstream logic for now

    // 4. Merge Logic Simulation
    console.log('\n--- MERGE SIMULATION ---');
    const merged = new Map();

    resultMatches.forEach(m => merged.set(m.game_id, m)); // Priority 3
    if (resultAshes) console.log(`After Results: Ashes is in map? ${merged.has(resultAshes.game_id)}`);

    upcomingMatches.forEach(m => merged.set(m.game_id, m)); // Priority 2
    if (resultAshes) console.log(`After Upcoming: Ashes is in map? ${merged.has(resultAshes.game_id)}`);

    liveMatches.forEach(m => merged.set(m.game_id, m)); // Priority 1
    if (resultAshes) console.log(`After Live: Ashes is in map? ${merged.has(resultAshes.game_id)}`);

    const finalMatch = resultAshes ? merged.get(resultAshes.game_id) : null;
    if (finalMatch) {
        console.log(`Final State of Ashes Match: ${finalMatch.event_state}`);
    } else {
        console.log('Ashes match is NOT in final merged list.');
    }
}

simulate();
