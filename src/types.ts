// Core API Types for boxcric

// Match participant (team)
export interface Participant {
    id: string;
    name: string;
    short_name: string;
    value?: string;
    highlight?: boolean;
}

// Match data from Wisden API
export interface Match {
    game_id: string;
    sport: string;
    series_id: string;
    series_name: string;
    start_date: string;
    end_date?: string; // ISO date string for completed matches
    event_state: 'U' | 'L' | 'C' | 'R'; // Upcoming, Live, Completed, Results
    event_status: string;
    event_sub_status?: string;
    event_format?: string;
    event_name?: string;
    short_event_status?: string;
    result?: string;
    result_code?: string;
    venue?: string;
    venue_city?: string;
    venue_name?: string;
    tour_name?: string;
    league_code?: string;
    participants: Participant[];
    has_standings?: string;
    match_title?: string;
    genders?: string;
}

// Player info in scorecard
export interface Player {
    Name_Full: string;
    Position?: string;
}

// Batsman in innings
export interface Batsman {
    Batsman: string;
    Runs: string;
    Balls: string;
    Fours: string;
    Sixes: string;
    Strikerate: string;
    Howout_short?: string;
    Isonstrike?: string;
    Isnonstriker?: string;
}

// Bowler in innings
export interface Bowler {
    Bowler: string;
    Overs: string;
    Maidens: string;
    Runs: string;
    Wickets: string;
    Economyrate: string;
    Isbowlingtandem?: string;
}

// Innings data
export interface Innings {
    Battingteam: string;
    Bowlingteam: string;
    Total: string;
    Wickets: string;
    Overs: string;
    Batsmen?: Batsman[];
    Bowlers?: Bowler[];
}

// Team in scorecard
export interface ScorecardTeam {
    Name_Full: string;
    Players: Record<string, Player>;
}

// Full scorecard response
export interface Scorecard {
    Matchid?: string;
    Innings?: Innings[];
    Teams?: Record<string, ScorecardTeam>;
}

// API response for matches list
export interface MatchesResponse {
    matches?: Match[];
}

// Series/Tournament data
export interface Series {
    seriesId: string;
    seriesName: string;
    matches: Match[];
}

export interface Tournament {
    seriesId: string;
    tournamentName: string;
    matches: Match[];
}
