import leaguesData from '../data/leagues.json';

// Type for the raw JSON
interface LeagueRaw {
    idLeague: string;
    strLeague: string;
    strSport: string;
    strLeagueAlternate?: string;
    strBadge?: string;
    strLogo?: string;
}

interface LeagueMap {
    [key: string]: {
        badge: string;
        banner: string;
    };
}

// In-memory cache of the map
let LEAGUE_MAP: LeagueMap | null = null;

// Initialize the map on first use
const getLeagueMap = (): LeagueMap => {
    if (LEAGUE_MAP) return LEAGUE_MAP;

    // Load from static JSON
    // @ts-ignore - imported json
    const rawList = (leaguesData.countries || leaguesData.leagues || []) as LeagueRaw[];

    const map: LeagueMap = {};
    rawList.forEach(L => {
        if (!L.strLeague) return;

        const entry = {
            badge: L.strBadge || '',
            banner: L.strLogo || '' // strLogo is usually the banner/wordmark
        };

        // Key: Normalized lower case name
        map[L.strLeague.toLowerCase()] = entry;

        // Also map alternate names
        if (L.strLeagueAlternate) {
            L.strLeagueAlternate.split(',').forEach(alt => {
                map[alt.trim().toLowerCase()] = entry;
            });
        }
    });

    LEAGUE_MAP = map;
    return map;
};

// Fuzzy match function
export const getLeagueLogo = (tournamentName: string): { badge: string; banner: string } | null => {
    if (!tournamentName) return null;

    const map = getLeagueMap();
    const cleanName = tournamentName.toLowerCase().trim();

    // 1. Exact Match
    if (map[cleanName]) return map[cleanName];

    // 2. Contains Match (e.g. "Big Bash League, 2024" -> "Australian Big Bash League")
    // iterate keys
    const keys = Object.keys(map);

    // Check if known league name is IN the search string
    // e.g. search: "Big Bash League 2024", key: "Big Bash League" -> MATCH
    for (const key of keys) {
        if (cleanName.includes(key) && key.length > 5) { // length check to avoid "IPL" matching "Triple A" randomly
            return map[key];
        }
    }

    // Check if search string is IN the known league name
    // e.g. search: "IPL", key: "Indian Premier League" -> No Match (need alias)
    // handled by aliases in map primarily, but can add specifics here

    // Special Manual Mappings for known gaps
    if (cleanName.includes('ipl') || cleanName.includes('indian premier league')) return map['indian premier league'];
    if (cleanName.includes('bbl') || cleanName.includes('big bash')) return map['australian big bash league'];
    if (cleanName.includes('sa20')) return map['sa20 league'];
    if (cleanName.includes('ilt20') || cleanName.includes('international league t20')) return map['international league t20'];
    if (cleanName.includes('world cup')) {
        // T20 vs ODI
        if (cleanName.includes('t20')) return map['icc world twenty20'];
        return map['icc cricket world cup'];
    }
    if (cleanName.includes('hundred')) return map['the hundred'];
    if (cleanName.includes('blast')) return map['t20 blast'];

    return null;
};
