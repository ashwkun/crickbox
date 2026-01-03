/**
 * Backfill Team Stats for NRR Calculation
 * 
 * Locates recent matches (last 60 days) in Supabase.
 * Fetches scorecards for them.
 * Extracts accurate "Total" and "AllotedBalls" data.
 * Populates `team_innings_stats` table.
 * 
 * Run: node scripts/backfill_team_stats.js
 */

const WISDEN_API = 'https://cricket-proxy.boxboxcric.workers.dev/?url=';
const CLIENT_SCORECARD = '430fdd0d';

async function main() {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get recent matches from our DB
    console.log('Fetching eligible matches from Supabase...');

    // Filter for matches that are Completed/Result
    // And within last 60 days (approx)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const dateStr = sixtyDaysAgo.toISOString();

    const { data: matches, error } = await supabase
        .from('tournament_matches')
        .select('*')
        .gte('created_at', dateStr)
        .in('result', ['Result', 'Completed', 'Match Ended', 'Stumps']); // Expanded result types just in case


    // Priority Configuration (Copied from sync_tournament_stats.js)
    const ICC_WORLD_CUPS = [
        'ICC World Twenty20', 'ICC Cricket World Cup', 'ICC Champions Trophy',
        "ICC Women's World Twenty20", "ICC Women's World Cup", 'ICC Under-19 World Cup'
    ];
    const ICC_EVENTS = ['Asia Cup'];
    const PREMIUM_LEAGUES = [
        'Indian Premier League', "Women's Premier League", 'Big Bash League', "Women's Big Bash League",
        'The Hundred', 'SA20', 'ILT20', 'Pakistan Super League', 'Caribbean Premier League',
        'Bangladesh Premier League', 'Lanka Premier League'
    ];

    function getMatchPriority(match) {
        const parentSeries = match.parent_series_name || '';
        const seriesName = match.series_name || '';
        const championship = match.championship_name || '';
        const searchFields = [parentSeries, seriesName, championship];
        const combined = searchFields.join(' ').toLowerCase();

        if (combined.includes('warm-up') || combined.includes('warm up') || combined.includes('qualifier')) return 18;
        if (ICC_WORLD_CUPS.some(n => searchFields.some(f => f.includes(n)))) return 1;
        if (ICC_EVENTS.some(n => searchFields.some(f => f.includes(n)))) return 3;
        if (PREMIUM_LEAGUES.some(n => searchFields.some(f => f.includes(n)))) return 5;
        return 100;
    }

    function filterPremiumMatches(matches) {
        const seriesMap = {};
        matches.forEach(m => {
            const sid = m.series_id || 'unknown';
            if (!seriesMap[sid]) {
                seriesMap[sid] = {
                    seriesId: sid,
                    seriesName: m.series_name,
                    teams: new Set(),
                    matches: [],
                    bestPriority: 999
                };
            }
            // We might not have participants in the DB row depending on schema, 
            // but 'teama_id' and 'teamb_id' usually exist.
            if (m.teama_id) seriesMap[sid].teams.add(m.teama_id);
            if (m.teamb_id) seriesMap[sid].teams.add(m.teamb_id);

            // Also check if participants JSON exists
            if (m.participants && Array.isArray(m.participants)) {
                m.participants.forEach(p => seriesMap[sid].teams.add(p.id));
            }

            const priority = getMatchPriority(m);
            if (priority < seriesMap[sid].bestPriority) seriesMap[sid].bestPriority = priority;
            seriesMap[sid].matches.push(m);
        });

        // Filter: teams > 2 AND priority <= 15
        // Note: If DB only has subset of matches, teams count might be low. 
        // But 'bestPriority' is reliable.
        const premiumSeries = Object.values(seriesMap).filter(
            s => s.bestPriority <= 15
        );

        console.log(`Filtered to ${premiumSeries.length} premium series.`);
        return premiumSeries.flatMap(s => s.matches);
    }

    if (error) {
        console.error('DB Fetch Error:', error);
        return;
    }

    console.log(`Found ${matches.length} matches in DB.`);

    // FILTER HERE
    const filteredMatches = filterPremiumMatches(matches);
    console.log(`Processing ${filteredMatches.length} matches after Premium Filter.`);

    let processed = 0;
    let errors = 0;

    for (const match of filteredMatches) {
        const gameId = match.id;
        const seriesId = match.series_id;

        try {
            // Fetch Scorecard
            const scorecard = await fetchScorecard(gameId);
            if (!scorecard || !scorecard.Innings) {
                console.log(`[${processed + 1}/${matches.length}] No scorecard data for ${gameId} (${match.series_name}) - Skipping`);
                continue;
            }

            const teamStats = [];

            // Values for NRR:
            // RunsScored = Total (includes extras)
            // BallsFaced = Total_Balls_Bowled (Actuals)
            // NRR Calculation Divisor = AllotedBalls if (Wickets=10 OR AllOut) else BallsFaced

            scorecard.Innings.forEach(inn => {
                // Ensure field naming matches our findings from check_bbl_scorecard.js
                // "Total": string "152"
                // "Wickets": string "10"
                // "Total_Balls_Bowled": string "272"
                // "AllotedBalls": string "540" (Wait, 540 balls? That's 90 overs - Test match. BBL should be 120)
                // "Overs": string "45.2"

                const runs = parseInt(inn.Total || '0', 10);
                const wickets = parseInt(inn.Wickets || '0', 10);
                const ballsFaced = parseInt(inn.Total_Balls_Bowled || '0', 10);
                const allotedBalls = parseInt(inn.AllotedBalls || '0', 10);
                const isAllOut = wickets === 10 || (inn.dismissal === 'all out'); // simplistic usage, wickets=10 is standard

                teamStats.push({
                    match_id: gameId,
                    team_id: inn.Battingteam,
                    innings_number: inn.Number === 'First' ? 1 : (inn.Number === 'Second' ? 2 : 1), // Simplification
                    series_id: seriesId,
                    runs: runs,
                    wickets: wickets,
                    overs_display: inn.Overs,
                    balls_faced: ballsFaced,
                    alloted_balls: allotedBalls,
                    is_all_out: isAllOut
                });
            });

            if (teamStats.length > 0) {
                const { error: upsertError } = await supabase
                    .from('team_innings_stats')
                    .upsert(teamStats, { onConflict: 'match_id,team_id' });

                if (upsertError) {
                    console.error(`Upsert Error for ${gameId}:`, upsertError.message);
                    errors++;
                }
            }

            processed++;
            if (processed % 10 === 0) {
                console.log(`Processed ${processed}/${matches.length} matches...`);
            }

            // Rate limit
            await new Promise(r => setTimeout(r, 200));

        } catch (e) {
            console.error(`Error processing ${gameId}:`, e);
            errors++;
        }
    }

    console.log(`\nBackfill Complete.`);
    console.log(`Processed: ${processed}`);
    console.log(`Errors: ${errors}`);
}

async function fetchScorecard(gameId) {
    const url = `https://www.wisden.com/cricket/v1/game/scorecard?game_id=${gameId}&lang=en&feed_format=json&client_id=${CLIENT_SCORECARD}`;
    const proxyUrl = `${WISDEN_API}${encodeURIComponent(url)}`;

    try {
        const res = await fetch(proxyUrl);
        if (!res.ok) return null;
        const json = await res.json();
        return json.data;
    } catch (e) {
        return null;
    }
}

main().catch(console.error);
