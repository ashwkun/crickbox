
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ycumznofytwntinxlxkc.supabase.co';
const SUPABASE_ANON_KEY = '***REMOVED***';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    console.log("=== Debugging Warner's Stats ===");
    const seriesId = '13215';
    const playerId = '5380'; // David Warner

    // Fetch individual innings
    console.log(`Fetching innings for P:${playerId} in S:${seriesId}...`);

    // We need to join manually or query batting_innings and filter by match_id

    // 1. Get all match IDs for this series
    const { data: matches } = await supabase
        .from('tournament_matches')
        .select('id, match_date, series_name')
        .eq('series_id', seriesId);

    const matchMap = new Map();
    matches?.forEach((m: any) => matchMap.set(m.id, m));
    const matchIds = matches?.map((m: any) => m.id) || [];

    console.log(`Total Matches in Series: ${matchIds.length}`);
    // distinct dates check
    const dates = matches?.map((m: any) => m.match_date).sort();
    if (dates && dates.length > 0) {
        console.log(`Date Range: ${dates[0]} to ${dates[dates.length - 1]}`);
    }

    // 2. Get batting innings for these matches
    const { data: innings } = await supabase
        .from('batting_innings')
        .select('*')
        .eq('player_id', playerId)
        .in('match_id', matchIds);

    if (!innings) {
        console.log("No innings found.");
    } else {
        console.log(`Innings found: ${innings.length}`);
        console.log("Sample Innings:");

        const details = innings.map((i: any) => {
            const m = matchMap.get(i.match_id);
            return {
                date: m?.match_date,
                runs: i.runs,
                match: m?.id
            };
        }).sort((a: any, b: any) => a.date.localeCompare(b.date));

        console.table(details);
    }
}

main();
