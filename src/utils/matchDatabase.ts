/**
 * Cricket Match Database Client
 * Fetches team form and match data from Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://ycumznofytwntinxlxkc.supabase.co';
const SUPABASE_ANON_KEY = '***REMOVED***';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Match {
    id: string;
    match_date: string;
    teama_id: string;
    teamb_id: string;
    teama: string;
    teamb: string;
    winner_id: string | null;
    result: string;
    league: string;
    series_id: string;
}

export type FormResult = 'W' | 'L' | 'D';

/**
 * Get recent form for a team
 * @param teamId Team ID (e.g., "1126" for India Women)
 * @param count Number of recent matches (default 5)
 * @returns Array of W/L/D results, most recent first
 */
export async function getTeamForm(teamId: string, count = 5): Promise<FormResult[]> {
    const { data, error } = await supabase
        .from('matches')
        .select('winner_id, teama_id, teamb_id')
        .or(`teama_id.eq.${teamId},teamb_id.eq.${teamId}`)
        .order('match_date', { ascending: false })
        .limit(count);

    if (error) {
        console.error('Error fetching team form:', error);
        return [];
    }

    return data.map(m => {
        if (m.winner_id === teamId) return 'W';
        if (m.winner_id === null) return 'D'; // Draw or no result
        return 'L';
    });
}

/**
 * Get recent matches for a team
 * @param teamId Team ID
 * @param limit Number of matches
 */
export async function getTeamMatches(teamId: string, limit = 50): Promise<Match[]> {
    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`teama_id.eq.${teamId},teamb_id.eq.${teamId}`)
        .order('match_date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching team matches:', error);
        return [];
    }

    return data as Match[];
}

/**
 * Get head-to-head matches between two teams
 * @param teamAId First team ID
 * @param teamBId Second team ID
 * @param limit Number of matches
 */
export async function getH2HMatches(
    teamAId: string,
    teamBId: string,
    limit = 10
): Promise<Match[]> {
    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`and(teama_id.eq.${teamAId},teamb_id.eq.${teamBId}),and(teama_id.eq.${teamBId},teamb_id.eq.${teamAId})`)
        .order('match_date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching H2H matches:', error);
        return [];
    }

    return data as Match[];
}

/**
 * Get matches by league
 * @param league League code (e.g., "ipl", "icc", "indian_domestic")
 * @param limit Number of matches
 */
export async function getMatchesByLeague(league: string, limit = 50): Promise<Match[]> {
    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('league', league)
        .order('match_date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching league matches:', error);
        return [];
    }

    return data as Match[];
}
