import { proxyFetch } from './api';
import { CLIENT_SCORECARD } from './wisdenConfig';

// ============ TYPES ============

// H2H Team Record
export interface TeamRecord {
    id: number;
    name: string;
    short_name: string;
    matches: number;
    win: number;
    loss: number;
    draw: number;
    noresult: number;
    win_percentage: number;
}

// Recent Match Result
export interface RecentMatch {
    id: number;
    file_name: string;
    result: string;
    result_short: 'w' | 'r' | 'd';
    venue_name: string;
    venue_city: string;
    winner_team_id: number | null;
    winner_team_name: string;
    loser_team_id: number | null;
    loser_team_name: string;
    match_player: string;
    match_number: string;
    match_start_date: string;
    win_by?: string;
    margin_value?: string;
    against_team_id?: number;
    against_team_name?: string;
    against_team_short_name?: string;
    home_team_id?: number | null;
    home_team_name?: string;
    away_team_id?: number | null;
    away_team_name?: string;
    innings: Array<{
        number: number;
        batting_team: number;
        bowling_team: number;
        total: number;
        wickets: number;
        overs: number;
    }>;
}

// Top Player Stats
export interface TopPlayer {
    id: number;
    name: string;
    short_name: string;
    icc_ranking?: number;
    // Batting
    runs?: number;
    batting_average?: number;
    highest_score?: string;
    hundreds?: number;
    fifties?: number;
    // Bowling
    wickets?: number;
    bowling_average?: number;
    best_figure?: string;
    five_wicket_haul?: number;
}

// Venue Stats
export interface VenueStats {
    venue_id: number;
    venue: string;
    venue_display_name: string;
    // API returns 'data' not 'teams' - confirmed via curl
    data: TeamRecord[];
    comp_type_id?: number;
    comp_type?: string;
    comp_type_display_name?: string;
    top_players?: {
        batsmen: { player: TopPlayer[] };
        bowler: { player: TopPlayer[] };
    };
}

// Full H2H Response
export interface H2HData {
    match_details: {
        match_id: number;
        comptype: string;
        parent_series_id: number;
        parent_series_name: string;
    };
    team: {
        head_to_head: {
            comp_type: {
                // API actually returns 'data', not 'teams'
                data: TeamRecord[];
                comp_type_id?: number;
                comp_type?: string;
                comp_type_display_name?: string;
            };
            venue: VenueStats;
        };
        against_last_n_matches: {
            n: number;
            result: RecentMatch[];
        };
    };
    player: {
        head_to_head: {
            venue: {
                teams: Array<{
                    id: number;
                    name: string;
                    short_name: string;
                    top_players: {
                        batsmen: { player: TopPlayer[] };
                        bowler: { player: TopPlayer[] };
                    };
                }>;
            };
        };
        last_n_matches?: {
            teams: Array<{
                id: number;
                name: string;
                short_name: string;
                top_players: {
                    n: number;
                    batsmen: { player: any[] };
                    bowler: { player: any[] };
                };
            }>;
        };
    };
}

// Squad Player
export interface SquadPlayer {
    player_id: number;
    player_name: string;
    short_name: string;
    role?: string;
    skill?: string;
    batting_style?: string;
    bowling_style?: string;
    is_captain?: boolean;
    is_keeper?: boolean;
}

// Squad Response
export interface SquadData {
    team_id: number;
    team_name: string;
    team_short_name: string;
    players: SquadPlayer[];
}

// ============ API FUNCTIONS ============

const BASE_URL = 'https://www.wisden.com/cricket/v1';

export async function fetchHeadToHead(gameId: string): Promise<H2HData | null> {
    try {
        const url = `${BASE_URL}/game/head-to-head?client_id=${CLIENT_SCORECARD}&feed_format=json&game_id=${gameId}&lang=en`;
        const response = await proxyFetch(url);
        return response?.data || null;
    } catch (error) {
        console.error('Failed to fetch H2H data:', error);
        return null;
    }
}

export async function fetchSquad(teamId: string, seriesId: string): Promise<SquadData | null> {
    try {
        const url = `${BASE_URL}/series/squad?team_id=${teamId}&series_id=${seriesId}&lang=en&feed_format=json&client_id=${CLIENT_SCORECARD}`;
        const response = await proxyFetch(url);

        if (!response?.data?.squads?.teams?.team) return null;

        // Navigate to the correct path: data.squads.teams.team[0].players.player
        const teamData = response.data.squads.teams.team[0];
        if (!teamData) return null;

        const players = teamData.players?.player || [];

        return {
            team_id: parseInt(teamId),
            team_name: teamData.name || '',
            team_short_name: teamData.short_name || '',
            players: players.map((p: any) => ({
                player_id: parseInt(p.id) || 0,
                player_name: p.name || p.full_display_name,
                short_name: p.short_name || p.name,
                role: p.role || p.skill_name,
                skill: p.skill_name,
                batting_style: p.sport_specific_keys?.batting_style,
                bowling_style: p.sport_specific_keys?.bowling_style,
                is_captain: p.sport_specific_keys?.is_captain === 'true',
                is_keeper: p.sport_specific_keys?.is_wicket_keeper === 'true'
            }))
        };
    } catch (error) {
        console.error('Failed to fetch squad data:', error);
        return null;
    }
}

// Helper to get series_id from H2H response
export function getSeriesIdFromH2H(h2hData: H2HData): string | null {
    return h2hData?.match_details?.parent_series_id?.toString() || null;
}
