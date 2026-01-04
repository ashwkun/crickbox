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

// ============ TOURNAMENT STATS ============

export interface TeamTournamentStats {
    team_id: string;
    series_id: string;
    runs_scored: number;
    overs_faced: number;
    runs_conceded: number;
    overs_bowled: number;
    nrr?: number;
}

export interface RunScorer {
    player_id: string;
    player_name: string;
    team_name: string;
    total_runs: number;
    innings: number;
    average: number;
    strike_rate: number;
    highest_score: number;
    fifties: number;
    hundreds: number;
}

export interface WicketTaker {
    player_id: string;
    player_name: string;
    team_name: string;
    total_wickets: number;
    innings: number;
    average: number;
    economy: number;
    best_bowling: string;
    four_wickets: number;
    five_wickets: number;
}

/**
 * Get team tournament stats (for NRR calculation)
 */
export async function getTeamTournamentStats(seriesId: string): Promise<TeamTournamentStats[]> {
    const { data, error } = await supabase
        .from('team_tournament_stats')
        .select('*')
        .eq('series_id', seriesId);

    if (error) {
        console.error('Error fetching team tournament stats:', error);
        return [];
    }

    return data as TeamTournamentStats[];
}

/**
 * Get top run scorers for a series
 */
/**
 * Get top run scorers for a series (aggregated client-side to handle duplicates)
 */
export async function getTopRunScorers(seriesId: string, limit = 10): Promise<RunScorer[]> {
    try {
        // 1. Get all matches for the series using tournament_matches to ensure ID alignment
        const { data: matches, error: matchError } = await supabase
            .from('tournament_matches')
            .select('id, team_home_id, team_away_id, series_name') // Assuming series_name is needed or available
            .eq('series_id', seriesId);

        if (matchError || !matches) {
            console.warn('Failed to fetch tournament_matches for stats:', matchError);
            return [];
        }

        const matchIds = matches.map(m => m.id);
        if (matchIds.length === 0) return [];

        // 2. Fetch ALL batting innings for these matches
        const { data: innings, error: inningsError } = await supabase
            .from('batting_innings')
            .select('*')
            .in('match_id', matchIds)
            .limit(3000); // Generous limit for a single tournament

        if (inningsError || !innings) {
            console.warn('Failed to fetch batting innings:', inningsError);
            return [];
        }

        // 3. De-duplicate and Aggregate
        // Deduplication Key: match_id + player_id
        // We will sum stats for each unique player
        const uniqueInnings = new Map<string, any>();

        innings.forEach((inn: any) => {
            const key = `${inn.match_id}_${inn.player_id}`;
            // If duplicate exists, we skip (assuming duplicates are identical)
            if (!uniqueInnings.has(key)) {
                uniqueInnings.set(key, inn);
            }
        });

        // Aggregation Map: player_id -> Stats
        const playerStats = new Map<string, RunScorer>();

        uniqueInnings.forEach((inn) => {
            const pid = inn.player_id;
            if (!playerStats.has(pid)) {
                playerStats.set(pid, {
                    player_id: pid,
                    player_name: inn.player_name,
                    team_name: '', // We'll need to fetch or infer this
                    total_runs: 0,
                    innings: 0,
                    average: 0,
                    strike_rate: 0,
                    highest_score: 0,
                    fifties: 0,
                    hundreds: 0,
                    // Internal for calculation
                    _balls: 0,
                    _outs: 0
                } as any);
            }

            const stat = playerStats.get(pid)!;
            stat.total_runs += (inn.runs || 0);
            stat.innings += 1;
            (stat as any)._balls += (inn.balls || 0);
            if (inn.is_out) (stat as any)._outs += 1;

            if ((inn.runs || 0) > stat.highest_score) stat.highest_score = inn.runs || 0;
            if ((inn.runs || 0) >= 100) stat.hundreds += 1;
            else if ((inn.runs || 0) >= 50) stat.fifties += 1;
        });

        // 4. Final Calculation & Sort
        const results = Array.from(playerStats.values()).map(p => {
            const balls = (p as any)._balls;
            const outs = (p as any)._outs;

            p.average = outs > 0 ? parseFloat((p.total_runs / outs).toFixed(2)) : p.total_runs;
            p.strike_rate = balls > 0 ? parseFloat(((p.total_runs / balls) * 100).toFixed(2)) : 0;

            // Clean up internal props
            delete (p as any)._balls;
            delete (p as any)._outs;

            return p;
        });

        // Sort by Total Runs Desc
        return results.sort((a, b) => b.total_runs - a.total_runs).slice(0, limit);

    } catch (e) {
        console.error("Error calculating run scorers:", e);
        return [];
    }
}

/**
 * Get top wicket takers for a series
 */
/**
 * Get top wicket takers for a series (aggregated client-side)
 */
export async function getTopWicketTakers(seriesId: string, limit = 10): Promise<WicketTaker[]> {
    try {
        // 1. Matches
        const { data: matches, error: matchError } = await supabase
            .from('tournament_matches')
            .select('id')
            .eq('series_id', seriesId);

        if (matchError || !matches) return [];
        const matchIds = matches.map(m => m.id);
        if (matchIds.length === 0) return [];

        // 2. Bowling Innings
        const { data: innings, error: inningsError } = await supabase
            .from('bowling_innings')
            .select('*')
            .in('match_id', matchIds)
            .limit(3000);

        if (inningsError || !innings) return [];

        // 3. Deduplicate
        const uniqueInnings = new Map<string, any>();
        innings.forEach((inn: any) => {
            const key = `${inn.match_id}_${inn.player_id}`;
            if (!uniqueInnings.has(key)) uniqueInnings.set(key, inn);
        });

        // 4. Aggregate
        const playerStats = new Map<string, WicketTaker>();

        uniqueInnings.forEach((inn) => {
            const pid = inn.player_id;
            if (!playerStats.has(pid)) {
                playerStats.set(pid, {
                    player_id: pid,
                    player_name: inn.player_name,
                    team_name: '',
                    total_wickets: 0,
                    innings: 0,
                    average: 0,
                    economy: 0,
                    best_bowling: '',
                    four_wickets: 0,
                    five_wickets: 0,
                    // Internal
                    _runs: 0,
                    _balls: 0, // balls_bowled
                    _best_wickets: 0,
                    _best_runs: 9999
                } as any);
            }

            const stat = playerStats.get(pid)!;
            const wkts = inn.wickets || 0;
            const runs = inn.runs || 0;
            const balls = inn.balls_bowled || (inn.overs ? Math.floor(inn.overs) * 6 + (inn.overs % 1 * 10) : 0); // approx

            stat.total_wickets += wkts;
            stat.innings += 1;
            (stat as any)._runs += runs;
            (stat as any)._balls += balls;

            // Best Bowling Logic (Most wickets, then least runs)
            if (wkts > (stat as any)._best_wickets || (wkts === (stat as any)._best_wickets && runs < (stat as any)._best_runs)) {
                (stat as any)._best_wickets = wkts;
                (stat as any)._best_runs = runs;
                stat.best_bowling = `${wkts}/${runs}`;
            }

            if (wkts === 4) stat.four_wickets += 1;
            if (wkts >= 5) stat.five_wickets += 1;
        });

        // Final Calcs
        const results = Array.from(playerStats.values()).map(p => {
            const runs = (p as any)._runs;
            const balls = (p as any)._balls;
            const wkts = p.total_wickets;

            p.average = wkts > 0 ? parseFloat((runs / wkts).toFixed(2)) : 0;
            p.economy = balls > 0 ? parseFloat(((runs / balls) * 6).toFixed(2)) : 0;

            delete (p as any)._runs;
            delete (p as any)._balls;
            delete (p as any)._best_wickets;
            delete (p as any)._best_runs;

            return p;
        });

        return results.sort((a, b) => b.total_wickets - a.total_wickets).slice(0, limit);

    } catch (e) {
        console.error("Error calculating wicket takers:", e);
        return [];
    }
}
