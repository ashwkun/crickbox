const { createClient } = require('@supabase/supabase-js');
// Native fetch in Node 20

// 1. Setup Supabase
const SUPABASE_URL = 'https://ycumznofytwntinxlxkc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Cwxlp3Az6TKQBXsIXnUemg_A4Avw-71';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDb() {
    const { count, error } = await supabase.from('matches').select('*', { count: 'exact', head: true });
    console.log(`Total Matches in DB: ${count} (Error: ${error?.message})`);
}
checkDb();

// 2. CricAPI for Upcoming Matches
const API_KEY = 'cd067272-9844-4866-9ec6-8a735050fc33'; // From API Key Audit
const UPCOMING_URL = `https://api.cricapi.com/v1/cricScore?apikey=${API_KEY}`;

const PROXY_URL = 'https://cricket-proxy.boxboxcric.workers.dev/?url=';
const CLIENT_MATCHES = 'e656463796'; // From docs
const WISDEN_UPCOMING = `https://www.wisden.com/default.aspx?methodtype=3&client=${CLIENT_MATCHES}&sport=1&league=0&timezone=0530&language=en&gamestate=2`;

async function checkDb() {
    console.log("Checking DB Content...");
    const { data: ausData, count: ausCount } = await supabase.from('matches').select('*', { count: 'exact', head: true }).or('teama_id.eq.1,teamb_id.eq.1');
    console.log(`Australia (ID 1) Matches in DB: ${ausCount}`);

    const { data: indData, count: indCount } = await supabase.from('matches').select('*', { count: 'exact', head: true }).or('teama_id.eq.4,teamb_id.eq.4');
    console.log(`India (ID 4) Matches in DB: ${indCount}`);
}
checkDb();

async function run() {
    console.log("Fetching REAL Upcoming Matches from Wisden API via Proxy...");
    const url = `${PROXY_URL}${encodeURIComponent(WISDEN_UPCOMING)}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const json = await res.json();
        // The API structure usually has a `matches` array or similar.
        // Based on docs, it returns a list of matches.
        // Let's inspect the `matches` property.
        const matches = json.matches || [];

        if (matches.length === 0) {
            console.error("No upcoming matches returned from API.");
            return;
        }

        console.log(`Found ${matches.length} Upcoming Matches.`);

        if (matches.length > 0) {
            // console.log("Participants Sample:", JSON.stringify(matches[0].participants, null, 2));
        }

        // Filter for International (league_code: icc) or IPL (league_code: ipl)
        // Or just anything that has valid participants with IDs

        const validMatches = matches.filter(m => {
            return m.participants && m.participants.length === 2 &&
                (m.league_code === 'icc' || m.league_code === 'ipl' || m.series_name?.includes('Test') || m.series_name?.includes('T20'));
        });

        console.log(`Found ${validMatches.length} valid International/Major matches out of ${matches.length}`);

        const targets = validMatches.slice(0, 5); // check top 5

        for (const match of targets) {
            const p1 = match.participants[0];
            const p2 = match.participants[1];

            const t1Id = p1.id;
            const t2Id = p2.id;
            const t1Name = p1.name;
            const t2Name = p2.name;
            const format = match.event_format || match.match_type || "t20";

            if (!t1Id || !t2Id) {
                console.log(`Skipping match ${match.game_id} due to missing IDs in participants.`);
                continue;
            }

            await checkPair(t1Name, t2Name, t1Id, t2Id, format);
        }

    } catch (e) {
        console.error("Failed to fetch upcoming matches:", e);
    }
}

async function checkPair(team1Name, team2Name, id1, id2, format) {
    console.log(`\n\n==================================================`);
    console.log(`Checking Match: ${team1Name} (${id1}) vs ${team2Name} (${id2}) - ${format}`);
    console.log(`==================================================`);

    // 3. Fetch Matches using provided IDs
    const getMatches = async (id) => {
        const { data, error } = await supabase.from('matches')
            .select('id, match_type, result, winner_id, teama, teamb, match_date')
            .or(`teama_id.eq.${id},teamb_id.eq.${id}`)
            .order('match_date', { ascending: false })
            .limit(50);

        if (error) console.error("Supabase Error:", error);
        return data || [];
    };

    const matches1 = await getMatches(id1);
    const matches2 = await getMatches(id2);

    // 4. Verification Logic
    const verify = (matches, teamName, teamId) => {
        console.log(`\n--- Verification for ${teamName} (ID: ${teamId}) ---`);
        const allForm = matches.slice(0, 5);

        const formatKey = (format || '').toLowerCase();

        const currentForm = matches.filter(m => {
            const mFormat = (m.match_type || '').toLowerCase();

            if (formatKey.includes('test')) return mFormat.includes('test');
            if (formatKey.includes('odi')) return mFormat.includes('odi') || mFormat.includes('one day');
            if (formatKey.includes('t20')) return mFormat.includes('t20') || mFormat.includes('twenty20');
            return mFormat.includes(formatKey) || formatKey.includes(mFormat);
        }).slice(0, 5);

        console.log(`Total History Fetched: ${matches.length}`);

        console.log("Last 5 ALL:");
        allForm.forEach(m => console.log(`  [${m.match_date}] ${m.match_type}: ${m.teama} vs ${m.teamb}`));

        console.log(`Last 5 CURRENT (${format}):`);
        currentForm.forEach(m => console.log(`  [${m.match_date}] ${m.match_type}: ${m.teama} vs ${m.teamb}`));

        const isRedundant = currentForm.length === allForm.length &&
            currentForm.every((m, i) => m.id === allForm[i].id);

        console.log(`\nREDUNDANT? ${isRedundant ? 'YES (1 Row)' : 'NO (2 Rows)'}`);
        return isRedundant;
    };

    const r1 = verify(matches1, team1Name, id1);
    const r2 = verify(matches2, team2Name, id2);

    console.log(`\n>>> FINAL CARD LAYOUT: ${r1 && r2 ? 'COMPACT (1 Row Each)' : 'STACKED (2 Rows Each)'}`);
}

run();
run();
