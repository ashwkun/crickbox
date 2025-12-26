
// Official Brand Colors for Major Cricket Teams
const TEAM_COLORS: Record<string, string> = {
    // International
    'India': '#0055D4', // Bleed Blue
    'Australia': '#FFCD00', // Gold
    'England': '#E30A17', // ECB Red/Blue
    'South Africa': '#007A4D', // Proteas Green
    'New Zealand': '#000000', // Black Caps
    'Pakistan': '#01411C', // Pak Green
    'West Indies': '#7B0029', // Maroon
    'Sri Lanka': '#1E226C', // Dark Blue
    'Bangladesh': '#006A4E', // Green
    'Afghanistan': '#0066CC', // Blue
    'Ireland': '#53AA30', // Green
    'Zimbabwe': '#E51937', // Red
    'Netherlands': '#FF6600', // Orange

    // IPL
    'Chennai Super Kings': '#F9CD05',
    'Mumbai Indians': '#004BA0',
    'Royal Challengers Bangalore': '#EC1C24',
    'Kolkata Knight Riders': '#3A225D',
    'Delhi Capitals': '#0078BC',
    'Punjab Kings': '#DD1F2D',
    'Rajasthan Royals': '#EA1A85',
    'Sunrisers Hyderabad': '#F7A721',
    'Lucknow Super Giants': '#3CF5F9',
    'Gujarat Titans': '#1B2133',

    // BBL (Big Bash)
    'Adelaide Strikers': '#0077C8',
    'Brisbane Heat': '#00979E',
    'Hobart Hurricanes': '#7D2F8C',
    'Melbourne Renegades': '#D81E27',
    'Melbourne Stars': '#1CB25B',
    'Perth Scorchers': '#F26F21',
    'Sydney Sixers': '#E5007D',
    'Sydney Thunder': '#96C93D',
};

const TEAM_ALIASES: Record<string, string> = {
    'IND': 'India',
    'AUS': 'Australia',
    'ENG': 'England',
    'RSA': 'South Africa',
    'NZ': 'New Zealand',
    'PAK': 'Pakistan',
    'WI': 'West Indies',
    'SL': 'Sri Lanka',
    'BAN': 'Bangladesh',
    'AFG': 'Afghanistan',
    'IRE': 'Ireland',
    'ZIM': 'Zimbabwe',
    'NED': 'Netherlands',
    'CSK': 'Chennai Super Kings',
    'MI': 'Mumbai Indians',
    'RCB': 'Royal Challengers Bangalore',
    'KKR': 'Kolkata Knight Riders',
    'DC': 'Delhi Capitals',
    'PBKS': 'Punjab Kings',
    'RR': 'Rajasthan Royals',
    'SRH': 'Sunrisers Hyderabad',
    'LSG': 'Lucknow Super Giants',
    'GT': 'Gujarat Titans',
    // BBL
    'STR': 'Adelaide Strikers',
    'HEA': 'Brisbane Heat',
    'HUR': 'Hobart Hurricanes',
    'REN': 'Melbourne Renegades',
    'STA': 'Melbourne Stars',
    'SCO': 'Perth Scorchers',
    'SIX': 'Sydney Sixers',
    'THU': 'Sydney Thunder',
};

// Helper for fuzzy matching or direct lookup
export const getTeamColor = (teamName?: string): string | null => {
    if (!teamName) return null;

    // 1. Direct match
    if (TEAM_COLORS[teamName]) return TEAM_COLORS[teamName];
    if (TEAM_ALIASES[teamName]) return TEAM_COLORS[TEAM_ALIASES[teamName]];

    const cleanName = teamName.trim();
    const cleanLower = cleanName.toLowerCase();

    // 2. Case Insensitive Key Match
    const foundKey = Object.keys(TEAM_COLORS).find(k => k.toLowerCase() === cleanLower);
    if (foundKey) return TEAM_COLORS[foundKey];

    // 3. Alias Match (Case Insensitive)
    const foundAlias = Object.keys(TEAM_ALIASES).find(k => k.toLowerCase() === cleanLower);
    if (foundAlias) return TEAM_COLORS[TEAM_ALIASES[foundAlias]];

    // 4. Partial Match (Name contains Key)
    // e.g. "India Men" contains "India"
    const foundPartial = Object.keys(TEAM_COLORS).find(k => cleanLower.includes(k.toLowerCase()));
    if (foundPartial) return TEAM_COLORS[foundPartial];

    return null;
};
