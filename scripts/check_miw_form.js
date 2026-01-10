// Verify India Men's form after repair
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ycumznofytwntinxlxkc.supabase.co';
const SUPABASE_ANON_KEY = '***REMOVED***';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyRepair() {
    const INDIA_ID = '4';
    const MI_W_ID = '3517';

    console.log("=== VERIFICATION: India Men (ID: 4) ===\n");

    const { data: indiaMatches } = await supabase
        .from('matches')
        .select('*')
        .or(`teama_id.eq.${INDIA_ID},teamb_id.eq.${INDIA_ID}`)
        .order('match_date', { ascending: false })
        .limit(10);

    indiaMatches?.forEach((m, i) => {
        const isIndiaA = m.teama_id === INDIA_ID;
        const opponentName = isIndiaA ? m.teamb : m.teama;
        let result = 'D';
        if (m.winner_id === INDIA_ID) result = 'W';
        else if (m.winner_id) result = 'L';

        console.log(`${i + 1}. [${result}] vs ${opponentName} (${m.match_type})`);
        console.log(`   Date: ${m.match_date} | Result: ${m.result || 'N/A'}`);
    });

    console.log("\n=== VERIFICATION: MI-W (ID: 3517) ===\n");

    const { data: miwMatches } = await supabase
        .from('matches')
        .select('*')
        .or(`teama_id.eq.${MI_W_ID},teamb_id.eq.${MI_W_ID}`)
        .order('match_date', { ascending: false })
        .limit(5);

    miwMatches?.forEach((m, i) => {
        const isMIWA = m.teama_id === MI_W_ID;
        const opponentName = isMIWA ? m.teamb : m.teama;
        let result = 'D';
        if (m.winner_id === MI_W_ID) result = 'W';
        else if (m.winner_id) result = 'L';

        console.log(`${i + 1}. [${result}] vs ${opponentName}`);
        console.log(`   Date: ${m.match_date} | Result: ${m.result || 'N/A'}`);
    });
}

verifyRepair().catch(console.error);
