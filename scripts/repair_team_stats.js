/**
 * Repair Team Stats for NRR Calculation
 * 
 * Finds matches with incomplete team_innings_stats and re-fetches scorecards
 * to populate correct data for NRR calculation.
 * 
 * Run: node scripts/repair_team_stats.js [--dry-run] [--limit N] [--match-id XXX]
 * 
 * Options:
 *   --dry-run    Show what would be repaired without making changes
 *   --limit N    Only process first N matches (for testing)
 *   --match-id   Repair a specific match only
 */

const WISDEN_API = 'https://cricket-proxy.boxboxcric.workers.dev/?url=';
const CLIENT_SCORECARD = '430fdd0d';

/**
 * Fetch scorecard from Wisden API
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
 * Extract team innings stats from scorecard
 */
function extractTeamStats(scorecard, matchId, seriesId) {
    if (!scorecard || !scorecard.Innings) return [];

    const stats = [];
    const inningsNumbers = { 'First': 1, 'Second': 2, 'Third': 3, 'Fourth': 4 };

    scorecard.Innings.forEach(inn => {
        const runs = parseInt(inn.Total || '0', 10);
        const wickets = parseInt(inn.Wickets || '0', 10);
        const ballsFaced = parseInt(inn.Total_Balls_Bowled || '0', 10);
        const allotedBalls = parseInt(inn.AllotedBalls || '0', 10);
        const isAllOut = wickets === 10;

        stats.push({
            match_id: matchId,
            team_id: inn.Battingteam,
            innings_number: inningsNumbers[inn.Number] || 1,
            series_id: seriesId,
            runs: runs,
            wickets: wickets,
            overs_display: inn.Overs,
            balls_faced: ballsFaced,
            alloted_balls: allotedBalls,
            is_all_out: isAllOut
        });
    });

    return stats;
}

/**
 * Main repair function
 */
async function main() {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse CLI args
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const limitIdx = args.indexOf('--limit');
    const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : null;
    const matchIdIdx = args.indexOf('--match-id');
    const specificMatchId = matchIdIdx !== -1 ? args[matchIdIdx + 1] : null;

    console.log('🔧 NRR Data Repair Script');
    console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    if (limit) console.log(`   Limit: ${limit} matches`);
    if (specificMatchId) console.log(`   Specific Match: ${specificMatchId}`);
    console.log('');

    try {
        // 1. Find affected matches
        let query = supabase
            .from('tournament_matches')
            .select('id, series_id, result')
            .or('result.ilike.%Progress%,result.ilike.%yet to begin%');

        if (specificMatchId) {
            query = supabase
                .from('tournament_matches')
                .select('id, series_id, result')
                .eq('id', specificMatchId);
        }

        const { data: affectedMatches, error: fetchError } = await query;

        if (fetchError) {
            throw new Error(`Failed to fetch affected matches: ${fetchError.message}`);
        }

        let matchesToRepair = affectedMatches || [];

        if (limit && matchesToRepair.length > limit) {
            matchesToRepair = matchesToRepair.slice(0, limit);
        }

        console.log(`Found ${affectedMatches?.length || 0} potentially affected matches`);
        console.log(`Will process ${matchesToRepair.length} matches\n`);

        if (matchesToRepair.length === 0) {
            console.log('✅ No matches need repair!');
            return;
        }

        // 2. Process each match
        let repaired = 0;
        let skipped = 0;
        let failed = 0;

        for (const match of matchesToRepair) {
            console.log(`[${repaired + skipped + failed + 1}/${matchesToRepair.length}] Processing ${match.id}...`);

            // Rate limiting
            await new Promise(r => setTimeout(r, 200));

            // Fetch fresh scorecard
            const scorecard = await fetchScorecard(match.id);
            if (!scorecard || !scorecard.Innings || scorecard.Innings.length === 0) {
                console.log(`   ⚠️  No scorecard data available (match may not be complete)`);
                skipped++;
                continue;
            }

            // Check if match is actually complete
            const matchStatus = scorecard.Matchdetail?.Status || '';
            if (!matchStatus.toLowerCase().includes('ended') &&
                !matchStatus.toLowerCase().includes('won') &&
                !matchStatus.toLowerCase().includes('beat')) {
                console.log(`   ⚠️  Match not complete yet: "${matchStatus}"`);
                skipped++;
                continue;
            }

            // Extract team stats
            const teamStats = extractTeamStats(scorecard, match.id, match.series_id);

            if (teamStats.length < 2) {
                console.log(`   ⚠️  Incomplete innings data (${teamStats.length} innings)`);
                skipped++;
                continue;
            }

            console.log(`   📊 Found ${teamStats.length} innings:`);
            teamStats.forEach(s => {
                console.log(`      Team ${s.team_id}: ${s.runs}/${s.wickets} (${s.balls_faced} balls)`);
            });

            if (dryRun) {
                console.log(`   🔍 DRY RUN - would update database`);
                repaired++;
                continue;
            }

            // Delete old entries
            const { error: delError } = await supabase
                .from('team_innings_stats')
                .delete()
                .eq('match_id', match.id);

            if (delError) {
                console.log(`   ❌ Failed to delete old entries: ${delError.message}`);
                failed++;
                continue;
            }

            // Insert new entries
            const { error: insertError } = await supabase
                .from('team_innings_stats')
                .insert(teamStats);

            if (insertError) {
                console.log(`   ❌ Failed to insert new entries: ${insertError.message}`);
                failed++;
                continue;
            }

            // Update match result
            const { error: updateError } = await supabase
                .from('tournament_matches')
                .update({ result: matchStatus })
                .eq('id', match.id);

            if (updateError) {
                console.log(`   ⚠️  Failed to update match result: ${updateError.message}`);
            }

            console.log(`   ✅ Repaired successfully`);
            repaired++;
        }

        console.log('\n========================================');
        console.log(`✅ Repaired: ${repaired}`);
        console.log(`⏭️  Skipped: ${skipped}`);
        console.log(`❌ Failed: ${failed}`);
        console.log('========================================');

    } catch (error) {
        console.error('Repair failed:', error);
        process.exit(1);
    }
}

main();
