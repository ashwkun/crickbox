/**
 * Sync Wisden matches to Supabase
 * Run: node scripts/sync_supabase.js
 * 
 * Environment variables required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY (service role key for write access)
 */

const WISDEN_API = 'https://cricket-proxy.boxboxcric.workers.dev/?url=';
const CLIENT_MATCHES = 'e656463796';

async function fetchWisdenMatches() {
    console.log('Fetching matches from Wisden...');

    const url = `https://www.wisden.com/default.aspx?methodtype=3&client=${CLIENT_MATCHES}&sport=1&league=0&timezone=0530&language=en&gamestate=3`;
    const proxyUrl = `${WISDEN_API}${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);
    const data = await response.json();

    console.log(`Fetched ${data.matches?.length || 0} matches`);
    return data.matches || [];
}

function transformMatch(m) {
    // Extract team info from participants
    const teama = m.participants?.[0];
    const teamb = m.participants?.[1];

    // Determine winner
    let winnerId = null;
    if (m.result_code === 'W' && m.event_sub_status) {
        // Parse winner from event_sub_status
        const status = m.event_sub_status;
        if (teama && status.includes(teama.name)) winnerId = teama.id;
        else if (teamb && status.includes(teamb.name)) winnerId = teamb.id;
    }

    // Extract date from game_id or start_date
    let matchDate = null;
    if (m.start_date) {
        matchDate = m.start_date.split('T')[0];
    } else if (m.game_id) {
        // game_id format: "xxxx12252025123456" - date is embedded
        const match = m.game_id.match(/(\d{2})(\d{2})(\d{4})(\d+)$/);
        if (match) {
            matchDate = `${match[3]}-${match[1]}-${match[2]}`;
        }
    }

    return {
        id: m.game_id,
        match_date: matchDate,
        teama_id: teama?.id || null,
        teamb_id: teamb?.id || null,
        teama: teama?.name || null,
        teamb: teamb?.name || null,
        winner_id: winnerId,
        result: m.event_sub_status || m.winning_margin || null,
        league: m.league_code || null,
        series_id: m.series_id || null,
        series_name: m.series_name || null,
        venue: m.venue || null,
        match_type: m.event_format || null
    };
}

async function upsertToSupabase(matches) {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Upserting ${matches.length} matches to Supabase...`);

    // Batch upsert in chunks of 500
    const CHUNK_SIZE = 500;
    let upserted = 0;

    for (let i = 0; i < matches.length; i += CHUNK_SIZE) {
        const chunk = matches.slice(i, i + CHUNK_SIZE);

        const { data, error } = await supabase
            .from('matches')
            .upsert(chunk, { onConflict: 'id' });

        if (error) {
            console.error(`Error upserting chunk ${i / CHUNK_SIZE}:`, error);
        } else {
            upserted += chunk.length;
            console.log(`Upserted ${upserted}/${matches.length} matches`);
        }
    }

    console.log('Sync complete!');
}

async function main() {
    try {
        // Fetch from Wisden
        const rawMatches = await fetchWisdenMatches();

        // Transform to our schema
        const matches = rawMatches
            .map(transformMatch)
            .filter(m => m.id && m.match_date); // Only valid matches

        console.log(`Transformed ${matches.length} valid matches`);

        // Upsert to Supabase
        await upsertToSupabase(matches);

    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

main();
