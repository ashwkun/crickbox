/**
 * Match Database - Supabase Operations
 * Handles caching and persistence of match data.
 */

import { supabase } from './supabaseClient';

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
    match_type?: string;
    event_format?: string;
}

export type FormResult = 'W' | 'L' | 'D';

/**
 * Get recent form for a team
 * @param teamId Team ID (e.g., "1126" for India Women)
 * @param count Number of recent matches (default 5)
 * @returns Array of W/L/D results, most recent first
 */
export async function getTeamForm(teamId: string, count = 5, matchType?: string): Promise<FormResult[]> {
    let query = supabase
        .from('matches')
        .select('winner_id, teama_id, teamb_id')
        .or(`teama_id.eq.${teamId},teamb_id.eq.${teamId}`);

    if (matchType) {
        query = query.eq('match_type', matchType.toLowerCase());
    }

    const { data, error } = await query
        .order('match_date', { ascending: false })
        .limit(count);

    if (error) {
        console.error('Error fetching team form:', error);
        return [];
    }

    return data.map(m => {
        if (m.winner_id === teamId) return 'W';
        if (m.winner_id === null) return 'D';
        return 'L';
    });
}

/**
 * Get recent matches for a team
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
