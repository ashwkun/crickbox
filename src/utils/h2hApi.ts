// ============ TYPES ONLY ============
// Fetch functions have been moved to useCricketData.ts

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
    runs?: number;
    batting_average?: number;
    highest_score?: string;
    hundreds?: number;
    fifties?: number;
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

// Helper to get series_id from H2H response
export function getSeriesIdFromH2H(h2hData: H2HData): string | null {
    return h2hData?.match_details?.parent_series_id?.toString() || null;
}

// Batsman Splits types
export interface BatsmanShot {
    Id: string;
    Runs: string;
    Zone: string;
    Angle: string;
    Distance: string;
}

export interface BatsmanVsBowler {
    Position: string;
    Bowler: string;
    Runs: string;
    Balls: string;
    Fours: string;
    Sixes: string;
    Dots: string;
    Strikerate: string;
    Scoringshots: string;
}

export interface BatsmanSplitsData {
    Batsman: string;
    Style: string;
    DotBalls: string;
    TimesDropped: string;
    Against: Record<string, BatsmanVsBowler>;
    Shots: BatsmanShot[];
}

export interface BatsmanSplitsResponse {
    Batsmen: Record<string, BatsmanSplitsData>;
}

// Over-by-Over types
export interface OverByOverBatsman {
    Batsman: string;
    Runs: string;
    Isout?: boolean;
}

export interface OverByOverBowler {
    Bowler: string;
    Runs: string;
}

export interface OverByOverEntry {
    Over: number;
    Runs: string;
    Wickets: string;
    Batsmen: Record<string, OverByOverBatsman>;
    Bowlers: Record<string, OverByOverBowler>;
}

export interface OverByOverResponse {
    Overbyover: OverByOverEntry[];
}
