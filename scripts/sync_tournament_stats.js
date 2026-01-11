/**
 * Sync Tournament Stats to Supabase
 * Fetches detailed scorecard data for premium tournaments (P1-15) 
 * and populates batting_innings & bowling_innings tables.
 * 
 * Run: node scripts/sync_tournament_stats.js
 * 
 * Environment variables required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY (service role key for write access)
 */

const WISDEN_API = 'https://cricket-proxy.boxboxcric.workers.dev/?url=';
const CLIENT_MATCHES = 'e656463796';
const CLIENT_SCORECARD = '430fdd0d';

// Priority configuration (from matchPriority.ts)
const ICC_WORLD_CUPS = [
    'ICC World Twenty20',
    'ICC Cricket World Cup',
    'ICC Champions Trophy',
    "ICC Women's World Twenty20",
    "ICC Women's World Cup",
    'ICC Under-19 World Cup'
];

const ICC_EVENTS = ['Asia Cup'];

const PREMIUM_LEAGUES = [
    'Indian Premier League',
    "Women's Premier League",
    'Big Bash League',
    "Women's Big Bash League",
    'The Hundred',
    'SA20',
    'ILT20',
    'Pakistan Super League',
    'Caribbean Premier League',
    'Bangladesh Premier League',
    'Lanka Premier League'
];

/**
 * Calculate match priority (matches matchPriority.ts logic)
 */
function getMatchPriority(match) {
    const parentSeries = match.parent_series_name || '';
    const seriesName = match.series_name || '';
    const championship = match.championship_name || '';
    const searchFields = [parentSeries, seriesName, championship];
    const combined = searchFields.join(' ').toLowerCase();

    // Early demotion: Warm-ups and Qualifiers
    if (combined.includes('warm-up') || combined.includes('warm up') || combined.includes('qualifier')) {
        return 18;
    }

    // ICC World Cups
    if (ICC_WORLD_CUPS.some(n => searchFields.some(f => f.includes(n)))) return 1;

    // Secondary ICC
    if (ICC_EVENTS.some(n => searchFields.some(f => f.includes(n)))) return 3;

    // Premium Leagues
    if (PREMIUM_LEAGUES.some(n => searchFields.some(f => f.includes(n)))) return 5;

    // Lower priority matches
    return 100;
}

/**
 * Group matches by series and identify premium tournaments (teams > 2 AND priority <= 15)
 */
function filterPremiumTournaments(matches) {
    // Group by series_id
    const seriesMap = {};
    matches.forEach(m => {
        const sid = m.series_id;
        if (!sid) return;

        if (!seriesMap[sid]) {
            seriesMap[sid] = {
                seriesId: sid,
                seriesName: m.series_name,
                teams: new Set(),
                matches: [],
                bestPriority: 999
            };
        }

        if (m.participants) {
            m.participants.forEach(p => seriesMap[sid].teams.add(p.id));
        }

        const priority = getMatchPriority(m);
        if (priority < seriesMap[sid].bestPriority) {
            seriesMap[sid].bestPriority = priority;
        }

        seriesMap[sid].matches.push(m);
    });

    // Filter: teams > 2 AND priority <= 15
    const premiumSeries = Object.values(seriesMap).filter(
        s => s.teams.size > 2 && s.bestPriority <= 15
    );

    // Flatten to matches
    const premiumMatches = premiumSeries.flatMap(s => s.matches);

    console.log(`Found ${premiumSeries.length} premium tournaments with ${premiumMatches.length} matches`);
    return premiumMatches;
}

/**
 * Format date as DDMMYYYY for Wisden API
 */
function formatDateForWisden(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}${mm}${yyyy}`;
}

/**
 * Fetch recent completed matches using daterange (last N days)
 * Uses daterange parameter instead of gamestate=3 for incremental sync
 */
async function fetchRecentMatches(daysBack = 2) {
    console.log(`Fetching matches from last ${daysBack} days...`);

    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - daysBack);

    const dateRange = `${formatDateForWisden(past)}-${formatDateForWisden(today)}`;
    console.log(`Date range: ${dateRange}`);

    // Note: No gamestate param - daterange alone returns completed matches
    const url = `https://www.wisden.com/default.aspx?methodtype=3&client=${CLIENT_MATCHES}&sport=1&league=0&timezone=0530&language=en&daterange=${dateRange}`;
    const proxyUrl = `${WISDEN_API}${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);
    const data = await response.json();

    const matches = data.matches || [];
    console.log(`Fetched ${matches.length} completed matches`);

    return matches;
}

/**
 * Fetch scorecard for a single match
 */
async function fetchScorecard(gameId) {
    const url = `https://www.wisden.com/cricket/v1/game/scorecard?game_id=${gameId}&lang=en&feed_format=json&client_id=${CLIENT_SCORECARD}`;
    const proxyUrl = `${WISDEN_API}${encodeURIComponent(url)}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) return null;

        const data = await response.json();
        return data.data || null;
    } catch (error) {
        console.error(`Failed to fetch scorecard for ${gameId}:`, error.message);
        return null;
    }
}

/**
 * Transform scorecard data to our schema
 */
function transformScorecard(scorecard, match) {
    if (!scorecard || !scorecard.Innings) return null;

    const matchData = {
        id: match.game_id,
        series_id: scorecard.Matchdetail?.Series?.Id || match.series_id,
        series_name: scorecard.Matchdetail?.Series?.Name || match.series_name,
        match_date: match.start_date?.split('T')[0] || null,
        match_type: scorecard.Matchdetail?.Match?.Type || match.event_format,
        venue_id: scorecard.Matchdetail?.Venue?.Id || null,
        venue_name: scorecard.Matchdetail?.Venue?.Name || match.venue,
        venue_city: scorecard.Matchdetail?.Venue?.City || null,
        venue_country: scorecard.Matchdetail?.Venue?.Country || null,
        pitch_suited_for: scorecard.Matchdetail?.Venue?.Pitch_Detail?.Pitch_Suited_For || null,
        toss_winner_id: scorecard.Matchdetail?.Tosswonby || null,
        toss_elected_to: scorecard.Matchdetail?.Toss_elected_to || null,
        team_home_id: scorecard.Matchdetail?.Team_Home || null,
        team_away_id: scorecard.Matchdetail?.Team_Away || null,
        result: scorecard.Matchdetail?.Status || null,
        priority: getMatchPriority(match)
    };

    // Skip Abandoned or No Result matches (should not affect NRR)
    if (matchData.result && (
        matchData.result.includes('Abandoned') ||
        matchData.result.includes('No Result') ||
        matchData.result.includes('Rain Stoppage')
    )) {
        return null;
    }

    const battingInnings = [];
    const bowlingInnings = [];

    // Get team names from Teams object
    const teams = scorecard.Teams || {};

    // Process each innings
    const inningsNumbers = { 'First': 1, 'Second': 2, 'Third': 3, 'Fourth': 4 };

    scorecard.Innings.forEach(innings => {
        const inningsNum = inningsNumbers[innings.Number] || 1;
        const battingTeamId = innings.Battingteam;
        const bowlingTeamId = innings.Bowlingteam;

        // Get player names from Teams object
        const battingTeam = teams[battingTeamId]?.Players || {};
        const bowlingTeam = teams[bowlingTeamId]?.Players || {};

        // Process batsmen
        (innings.Batsmen || []).forEach(bat => {
            if (!bat.Batsman) return;

            const playerInfo = battingTeam[bat.Batsman] || {};

            battingInnings.push({
                match_id: match.game_id,
                innings_number: inningsNum,
                player_id: bat.Batsman,
                player_name: playerInfo.Name_Full || `Player ${bat.Batsman}`,
                team_id: battingTeamId,
                batting_position: parseInt(bat.Number) || null,
                runs: parseInt(bat.Runs) || 0,
                balls: parseInt(bat.Balls) || 0,
                fours: parseInt(bat.Fours) || 0,
                sixes: parseInt(bat.Sixes) || 0,
                dots: parseInt(bat.Dots) || 0,
                strike_rate: parseFloat(bat.Strikerate) || null,
                is_out: bat.Dismissal !== 'not out' && bat.Dismissal !== '',
                dismissal_type: bat.DismissalType || null,
                dismissed_by_id: bat.Bowler || null,
                fielder_id: bat.Fielder || null
            });
        });

        // Process bowlers
        (innings.Bowlers || []).forEach(bowl => {
            if (!bowl.Bowler) return;

            const playerInfo = bowlingTeam[bowl.Bowler] || {};

            bowlingInnings.push({
                match_id: match.game_id,
                innings_number: inningsNum,
                player_id: bowl.Bowler,
                player_name: playerInfo.Name_Full || `Player ${bowl.Bowler}`,
                team_id: bowlingTeamId,
                overs: parseFloat(bowl.Overs) || 0,
                balls_bowled: parseInt(bowl.Balls_Bowled) || 0,
                maidens: parseInt(bowl.Maidens) || 0,
                runs: parseInt(bowl.Runs) || 0,
                wickets: parseInt(bowl.Wickets) || 0,
                dots: parseInt(bowl.Dots) || 0,
                economy: parseFloat(bowl.Economyrate) || null,
                wides: parseInt(bowl.Wides) || 0,
                noballs: parseInt(bowl.Noballs) || 0,
                avg_speed: parseFloat(bowl.Avg_Speed) || null
            });
        });
    });

    return { matchData, battingInnings, bowlingInnings };
}

/**
 * Upsert data to Supabase
 */
async function upsertToSupabase(supabase, tableName, data, conflictKey = 'id', batchSize = 500) {
    if (!data.length) return 0;

    let upserted = 0;

    for (let i = 0; i < data.length; i += batchSize) {
        const chunk = data.slice(i, i + batchSize);

        const { error } = await supabase
            .from(tableName)
            .upsert(chunk, { onConflict: conflictKey });

        if (error) {
            console.error(`Error upserting to ${tableName}:`, error.message);
        } else {
            upserted += chunk.length;
        }
    }

    return upserted;
}


/**
 * Run Cleanup of Duplicates
 * USAGE: node scripts/sync_tournament_stats.js clean
 */
async function runCleanup(supabase) {
    console.log("🧹 Starting Deep Cleanup of stats...");

    // 1. Get all matches
    const { data: matches } = await supabase.from('tournament_matches').select('id');
    console.log(`Scanning stats for ${matches.length} matches...`);

    let totalDeleted = 0;

    // Process in chunks to avoid timeouts
    const CHUNK_SIZE = 50;
    for (let i = 0; i < matches.length; i += CHUNK_SIZE) {
        const batch = matches.slice(i, i + CHUNK_SIZE);
        const matchIds = batch.map(m => m.id);

        // Fetch all batting innings for these matches
        const { data: batting } = await supabase
            .from('batting_innings')
            .select('id, match_id, player_id, created_at')
            .in('match_id', matchIds);

        // Group by Match+Player
        const groups = {};
        batting.forEach(row => {
            const key = `${row.match_id}_${row.player_id}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
        });

        const toDeleteIds = [];
        Object.values(groups).forEach(rows => {
            if (rows.length > 1) {
                // Sort by created_at desc (keep newest)
                rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                // Delete all except first
                const dups = rows.slice(1);
                dups.forEach(d => toDeleteIds.push(d.id));
            }
        });

        if (toDeleteIds.length > 0) {
            console.log(`Deleting ${toDeleteIds.length} duplicates in batch ${i}...`);
            await supabase.from('batting_innings').delete().in('id', toDeleteIds);
            totalDeleted += toDeleteIds.length;
        }
    }

    console.log(`✅ Cleanup Complete. Removed ${totalDeleted} duplicate rows.`);
}

/**
 * Main sync function
 */
async function main() {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for cleanup flag
    if (process.argv.includes('clean')) {
        await runCleanup(supabase);
        return;
    }

    try {
        // 1. Fetch recent matches (last 2 days)
        const allMatches = await fetchRecentMatches(2);

        // 1b. Filter to only COMPLETED matches (R = Result, C = Cancelled/Completed)
        // This prevents syncing live matches with incomplete innings data
        const completedMatches = allMatches.filter(m =>
            m.event_state === 'R' || m.event_state === 'C'
        );
        console.log(`Filtered to ${completedMatches.length} completed matches (R/C only)`);

        // 2. Filter to premium tournaments
        const premiumMatches = filterPremiumTournaments(completedMatches);

        // 3. Check which matches are already synced (Optimized & Limit-Safe)
        const matchIdsToCheck = premiumMatches.map(m => String(m.game_id));

        const { data: existingMatches } = await supabase
            .from('tournament_matches')
            .select('id')
            .in('id', matchIdsToCheck);

        const existingIds = new Set((existingMatches || []).map(m => String(m.id)));
        const newMatches = premiumMatches.filter(m => !existingIds.has(String(m.game_id)));

        console.log(`Found ${existingIds.size} existing matches out of ${premiumMatches.length} candidates.`);
        console.log(`${newMatches.length} new matches to process.`);

        if (newMatches.length === 0) {
            console.log('No new matches to sync.');
            return;
        }

        // 4. Process each new match
        const allMatchData = [];
        const allBattingInnings = [];
        const allBowlingInnings = [];
        const allTeamStats = [];

        // Process all new matches
        const matchesToProcess = newMatches;
        // Collect IDs for cleanup (idempotency)
        const matchIdsToSync = matchesToProcess.map(m => String(m.game_id));

        console.log(`Processing all ${matchesToProcess.length} matches...`);

        for (let i = 0; i < matchesToProcess.length; i++) {
            const match = matchesToProcess[i];

            // Rate limiting: 1 request per 200ms
            await new Promise(r => setTimeout(r, 200));

            const scorecard = await fetchScorecard(match.game_id);
            if (!scorecard) {
                console.log(`[${i + 1}/${matchesToProcess.length}] No scorecard for ${match.game_id}`);
                continue;
            }

            const transformed = transformScorecard(scorecard, match);
            if (!transformed) continue;

            allMatchData.push(transformed.matchData);
            allBattingInnings.push(...transformed.battingInnings);
            allBowlingInnings.push(...transformed.bowlingInnings);

            // EXTRACT TEAM STATS FOR NRR
            if (scorecard.Innings) {
                scorecard.Innings.forEach(inn => {
                    const runs = parseInt(inn.Total || '0', 10);
                    const wickets = parseInt(inn.Wickets || '0', 10);
                    const ballsFaced = parseInt(inn.Total_Balls_Bowled || '0', 10);
                    const allotedBalls = parseInt(inn.AllotedBalls || '0', 10);
                    const isAllOut = wickets === 10 || (inn.dismissal === 'all out');

                    allTeamStats.push({
                        match_id: match.game_id,
                        team_id: inn.Battingteam,
                        innings_number: inn.Number === 'First' ? 1 : (inn.Number === 'Second' ? 2 : 1),
                        series_id: match.series_id,
                        runs: runs,
                        wickets: wickets,
                        overs_display: inn.Overs,
                        balls_faced: ballsFaced,
                        alloted_balls: allotedBalls,
                        is_all_out: isAllOut
                    });
                });
            }

            if ((i + 1) % 10 === 0) {
                console.log(`[${i + 1}/${matchesToProcess.length}] Processed: ${match.series_name}`);
            }
        }

        // 5. Upsert to Supabase
        console.log('\nUpserting to Supabase...');

        // CRITICAL: Delete existing stats for these matches first to allow re-sync (Idempotency)
        if (matchIdsToSync.length > 0) {
            console.log(`Cleaning up old stats for ${matchIdsToSync.length} matches...`);
            const { error: delBatError } = await supabase.from('batting_innings').delete().in('match_id', matchIdsToSync);
            const { error: delBowlError } = await supabase.from('bowling_innings').delete().in('match_id', matchIdsToSync);
            const { error: delTeamError } = await supabase.from('team_innings_stats').delete().in('match_id', matchIdsToSync);

            if (delBatError) console.error("Error cleaning batting_innings:", delBatError);
            if (delBowlError) console.error("Error cleaning bowling_innings:", delBowlError);
        }

        const matchesUpserted = await upsertToSupabase(supabase, 'tournament_matches', allMatchData);
        console.log(`  tournament_matches: ${matchesUpserted} rows`);

        const battingUpserted = await upsertToSupabase(supabase, 'batting_innings', allBattingInnings);
        console.log(`  batting_innings: ${battingUpserted} rows`);

        const bowlingUpserted = await upsertToSupabase(supabase, 'bowling_innings', allBowlingInnings);
        console.log(`  bowling_innings: ${bowlingUpserted} rows`);

        const teamStatsUpserted = await upsertToSupabase(supabase, 'team_innings_stats', allTeamStats, 'match_id,team_id');
        console.log(`  team_innings_stats: ${teamStatsUpserted} rows (NRR Data)`);

        console.log('\n✅ Sync complete!');
        console.log(`   Matches: ${matchesUpserted}`);
        console.log(`   Batting: ${battingUpserted} innings`);
        console.log(`   Bowling: ${bowlingUpserted} innings`);
        console.log(`   TeamStats: ${teamStatsUpserted} rows`);

    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

main();
