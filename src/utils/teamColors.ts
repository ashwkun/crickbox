
// Official Brand Colors for Major Cricket Teams
const TEAM_COLORS: Record<string, string> = {
    // International
    'India': '#3388FF', // Brighter Blue
    'Australia': '#FFCD00', // Gold (Good)
    'England': '#EF4444', // Pop Red
    'South Africa': '#00C853', // Vibrant Green
    'New Zealand': '#A6A6A6', // Silver
    'Pakistan': '#01A354', // Distinct "Pak Green" (Deeper but bright)
    'West Indies': '#D32F2F', // Maroon
    'Sri Lanka': '#4B63CF', // Royal Blue
    'Bangladesh': '#00B36B', // Teal Green
    'Afghanistan': '#0066D6', // Deeper Blue
    'Ireland': '#76D74F', // Lime Green
    'Zimbabwe': '#E0291D', // Distinct Red
    // Associates & Others
    'Scotland': '#FFD700', // Gold (User Request)
    'Nepal': '#003DA5',
    'UAE': '#000000',
    'USA': '#2C498D',
    'Namibia': '#003580',
    'Oman': '#D61921',
    'Papua New Guinea': '#E31837',
    'Canada': '#D80000', // Deep Red
    'Hong Kong': '#D60C18',
    'Jersey': '#E30613',
    'Uganda': '#FCDD09',
    'Italy': '#0058A7',

    // IPL
    'Chennai Super Kings': '#FFD700', // Gold
    'Mumbai Indians': '#2F80ED', // Brighter MI Blue
    'Royal Challengers': '#FF3333', // Brighter Red
    'Royal Challengers Bangalore': '#FF3333',
    'Royal Challengers Bengaluru': '#FF3333',
    'Kolkata Knight Riders': '#8A2BE2', // Blue Violet (Bright Purple)
    'Delhi Capitals': '#2596BE', // Brighter Blue
    'Punjab Kings': '#FF3333', // Brighter Red
    'Rajasthan Royals': '#FF69B4', // Hot Pink
    'Sunrisers Hyderabad': '#FFA500', // Orange
    'Lucknow Super Giants': '#00FFFF', // Cyan (Pop)
    'Gujarat Titans': '#5D6D7E', // Grey Blue

    // Indian Domestic (Ranji / Vijay Hazare / SMAT)
    'Mumbai': '#004BA0', // MI Blueish
    'Karnataka': '#E31E24', // Red/Yellow
    'Tamil Nadu': '#F9CD05', // Yellow
    'Delhi': '#0078BC',
    'Punjab': '#DD1F2D',
    'Bengal': '#4E2E8F', // Purple
    'Uttar Pradesh': '#000000',
    'Saurashtra': '#F7A721', // Orange
    'Gujarat': '#1B2133',
    'Baroda': '#003366', // Dark Blue
    'Maharashtra': '#F9CD05',
    'Vidarbha': '#0066CC',
    'Andhra': '#0055D4',
    'Hyderabad': '#F7A721',
    'Kerala': '#3CB878', // Green
    'Goa': '#003DA5',
    'Rajasthan': '#EA1A85',
    'Madhya Pradesh': '#0055D4',
    'Haryana': '#3A225D',
    'Himachal Pradesh': '#E30A17',
    'Jammu & Kashmir': '#00703C',
    'Jharkhand': '#003580',
    'Odisha': '#C60C30',
    'Assam': '#54C25C',
    'Tripura': '#E31837',
    'Railways': '#1E226C',
    'Services': '#003366',
    'Uttarakhand': '#00979E',
    'Puducherry': '#0078BC',
    'Chandigarh': '#F26F21',
    'Chhattisgarh': '#3CB878',
    'Bihar': '#4E2E8F',
    'Manipur': '#0055D4',
    'Meghalaya': '#0066CC',
    'Mizoram': '#E30A17',
    'Nagaland': '#53AA30',
    'Sikkim': '#FFCD00',
    'Arunachal Pradesh': '#0055D4',

    // More National Teams
    'Kuwait': '#007A3D',
    'Qatar': '#8A1538',
    'Malaysia': '#FFCC00',
    'Singapore': '#DA291C',
    'Germany': '#000000',
    'Denmark': '#C60C30',
    'Kenya': '#006600',
    'Bermuda': '#00247D',
    'Tanzania': '#1EB53A',
    'Nigeria': '#008751',
    'Rwanda': '#00A1DE',
    'Japan': '#BC002D',
    'Indonesia': '#FF0000',
    'Thailand': '#2D2A4A',
    'Bhutan': '#FF5F00',
    'Maldives': '#007E3A',
    'Myanmar': '#FECB00', // Yellow
    'Cambodia': '#032EA1', // Royal Blue
    'Vanuatu': '#D21034',
    'Fiji': '#6ECFF6',
    'Samoa': '#003366',
    'Cook Islands': '#006600',

    // WPL (Women's Premier League)
    'Mumbai Indians Women': '#004BA0',
    'Royal Challengers Bangalore Women': '#EC1C24',
    'Delhi Capitals Women': '#0078BC',
    'UP Warriorz': '#FFD700',
    'Gujarat Giants': '#FF6600',

    // PSL (Pakistan Super League)
    'Lahore Qalandars': '#54C25C',
    'Karachi Kings': '#FF0000',
    'Islamabad United': '#E31E24',
    'Peshawar Zalmi': '#FCD015',
    'Quetta Gladiators': '#4E2E8F',
    'Multan Sultans': '#00703C',

    // SA20
    'Sunrisers Eastern Cape': '#F7A721',
    'Pretoria Capitals': '#0078BC',
    'Paarl Royals': '#EA1A85',
    'Durban Super Giants': '#3CF5F9', // Use LSG color
    'Joburg Super Kings': '#F9CD05',
    'MI Cape Town': '#004BA0',

    // BBL (Big Bash)
    'Adelaide Strikers': '#0077C8',
    'Brisbane Heat': '#00979E',
    'Hobart Hurricanes': '#7D2F8C',
    'Melbourne Renegades': '#D81E27',
    'Melbourne Stars': '#1CB25B',
    'Perth Scorchers': '#F26F21',
    'Sydney Sixers': '#E5007D',
    'Sydney Thunder': '#96C93D',

    // The Hundred (Men & Women)
    'Birmingham Phoenix': '#F26522',
    'London Spirit': '#0071B9',
    'Manchester Originals': '#000000',
    'Northern Superchargers': '#662D91',
    'Oval Invincibles': '#3CB878',
    'Southern Brave': '#00FF00', // Bright Lime
    'Trent Rockets': '#FFD200',
    'Welsh Fire': '#EF3E42',

    // CPL (Caribbean Premier League)
    'Trinbago Knight Riders': '#3A225D',
    'Guyana Amazon Warriors': '#00A651',
    'Barbados Royals': '#003366',
    'St Kitts & Nevis Patriots': '#EC1C24',
    'Saint Lucia Kings': '#005DAA',
    'Antigua & Barbuda Falcons': '#FFC425',

    // BPL (Bangladesh Premier League)
    'Comilla Victorians': '#ED1B24',
    'Rangpur Riders': '#1B75BC',
    'Sylhet Strikers': '#6D2077',
    'Fortune Barishal': '#F58220',
    'Khulna Tigers': '#582C83',
    'Chattogram Challengers': '#2E3192',

    // ILT20
    'Abu Dhabi Knight Riders': '#3A225D',
    'Desert Vipers': '#D21F3C',
    'Dubai Capitals': '#0078BC',
    'Gulf Giants': '#F58220',
    'MI Emirates': '#004BA0',
    'Sharjah Warriors': '#367C2B',

    // MLC (Major League Cricket)
    'MI New York': '#004BA0',
    'Seattle Orcas': '#65B32E',
    'Texas Super Kings': '#F9CD05',
    'San Francisco Unicorns': '#F47920',
    'Los Angeles Knight Riders': '#3A225D',
    'Washington Freedom': '#DA291C',
};

const TEAM_ALIASES: Record<string, string> = {
    // International
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
    'SCO': 'Scotland',
    'NEP': 'Nepal',
    'UAE': 'UAE',
    'USA': 'USA',
    'NAM': 'Namibia',
    'OMA': 'Oman',
    'PNG': 'Papua New Guinea',
    'CAN': 'Canada',
    'HK': 'Hong Kong',
    'ITA': 'Italy',
    'KUW': 'Kuwait',
    'QAT': 'Qatar',
    'MAL': 'Malaysia',
    'SIN': 'Singapore',
    'GER': 'Germany',
    'DEN': 'Denmark',
    'KEN': 'Kenya',
    'BER': 'Bermuda',
    'TAN': 'Tanzania',
    'NIG': 'Nigeria',
    'RWA': 'Rwanda',
    'JPN': 'Japan',
    'INO': 'Indonesia',
    'THA': 'Thailand',
    'BHU': 'Bhutan',
    'MDV': 'Maldives',
    'MYA': 'Myanmar',
    'CAB': 'Cambodia',
    'VAN': 'Vanuatu',
    'FIJ': 'Fiji',
    'SAM': 'Samoa',

    // Indian Domestic
    'MUM': 'Mumbai',
    'KAR': 'Karnataka',
    'TN': 'Tamil Nadu',
    'DEL': 'Delhi',
    'PUN': 'Punjab',
    'BEN': 'Bengal',
    'UP': 'Uttar Pradesh',
    'SAU': 'Saurashtra',
    'GUJ': 'Gujarat',
    'BAR': 'Baroda',
    'MAH': 'Maharashtra',
    'VID': 'Vidarbha',
    'AP': 'Andhra',
    'HYD': 'Hyderabad',
    'KER': 'Kerala',
    'GOA': 'Goa',
    'RAJ': 'Rajasthan',
    'MP': 'Madhya Pradesh',
    'HAR': 'Haryana',
    'HP': 'Himachal Pradesh',
    'J&K': 'Jammu & Kashmir',
    'JHA': 'Jharkhand',
    'ODI': 'Odisha',
    'ASS': 'Assam',
    'TRI': 'Tripura',
    'RLY': 'Railways',
    'SER': 'Services',
    'UTT': 'Uttarakhand',
    'PUD': 'Puducherry',
    'CHA': 'Chandigarh',
    'CHT': 'Chhattisgarh',
    'BIH': 'Bihar',
    'MAN': 'Manipur',
    'MEG': 'Meghalaya',
    'MIZ': 'Mizoram',
    'NAG': 'Nagaland',
    'SIK': 'Sikkim',
    'ARU': 'Arunachal Pradesh',

    // IPL
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

    // PSL
    'LQ': 'Lahore Qalandars',
    'KK': 'Karachi Kings',
    'IU': 'Islamabad United',
    'PZ': 'Peshawar Zalmi',
    'QG': 'Quetta Gladiators',
    'MS': 'Multan Sultans',

    // BBL
    'STR': 'Adelaide Strikers',
    'HEA': 'Brisbane Heat',
    'HUR': 'Hobart Hurricanes',
    'REN': 'Melbourne Renegades',
    'STA': 'Melbourne Stars',
    // 'SCO': 'Perth Scorchers', // Conflict with Scotland
    'SIX': 'Sydney Sixers',
    'THU': 'Sydney Thunder',

    // The Hundred
    'BPH': 'Birmingham Phoenix',
    'LNS': 'London Spirit',
    'MNR': 'Manchester Originals',
    'NOS': 'Northern Superchargers',
    'OVI': 'Oval Invincibles',
    'SOB': 'Southern Brave',
    'TRT': 'Trent Rockets',
    'WEF': 'Welsh Fire',

    // SA20
    'SEC': 'Sunrisers Eastern Cape',
    'PC': 'Pretoria Capitals',
    'PR': 'Paarl Royals',
    'DSG': 'Durban Super Giants',
    'JSK': 'Joburg Super Kings',
    'MICT': 'MI Cape Town',

    // MLC
    'MINY': 'MI New York',
    'SEO': 'Seattle Orcas',
    'TSK': 'Texas Super Kings',
    'SFU': 'San Francisco Unicorns',
    'LAKR': 'Los Angeles Knight Riders',
    'WAF': 'Washington Freedom',
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

    // 5. Alias Partial Match (Name contains Alias)
    // e.g. "IND W" contains "IND" -> India
    // Sort aliases by length descending to match longest alias first (avoid matching "S" in "USA")
    const foundAliasPartial = Object.keys(TEAM_ALIASES)
        .sort((a, b) => b.length - a.length)
        .find(alias => cleanLower.includes(alias.toLowerCase()));

    if (foundAliasPartial) return TEAM_COLORS[TEAM_ALIASES[foundAliasPartial]];

    return null;
};
