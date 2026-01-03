/**
 * Tournament Abbreviations Utility
 * Provides short codes for tournament names (used in hero fallback when no logo)
 */

// Hardcoded abbreviations for premium/known tournaments
const TOURNAMENT_ABBREVIATIONS: Record<string, string> = {
    // ICC Events (Men)
    'ICC World Twenty20': 'T20 WC',
    'ICC Cricket World Cup': 'ODI WC',
    'ICC Champions Trophy': 'CT',
    'ICC Under-19 World Cup': 'U19 WC',

    // ICC Events (Women)
    "ICC Women's World Twenty20": 'W-T20 WC',
    "ICC Women's World Cup": 'W-ODI WC',

    // Regional Events
    'Asia Cup': 'ASIA',
    'Asia Cup T20I': 'ASIA',

    // Premium Leagues (Men)
    'Indian Premier League': 'IPL',
    'Big Bash League': 'BBL',
    'The Hundred': '100',
    'SA20 league': 'SA20',
    'SA20': 'SA20',
    'ILT20': 'ILT20',
    'International League T20': 'ILT20',
    'Pakistan Super League': 'PSL',
    'Caribbean Premier League': 'CPL',
    'Bangladesh Premier League': 'BPL',
    'Lanka Premier League': 'LPL',

    // Premium Leagues (Women)
    "Women's Premier League": 'WPL',
    "Women's Big Bash League": 'WBBL',
    'The Hundred Women': 'W-100',
};

/**
 * Get abbreviation for a tournament name.
 * - First checks hardcoded map (partial match)
 * - Falls back to auto-generation (first letters of significant words)
 */
export function getTournamentAbbreviation(tournamentName: string | undefined): string {
    if (!tournamentName) return '???';

    const cleanName = tournamentName.trim();

    // 1. Check hardcoded map (partial match)
    for (const [key, abbr] of Object.entries(TOURNAMENT_ABBREVIATIONS)) {
        if (cleanName.toLowerCase().includes(key.toLowerCase())) {
            return abbr;
        }
    }

    // 2. Auto-generate: Remove year, take first letters
    const withoutYear = cleanName
        .replace(/,?\s*\d{4}(-\d{2,4})?\/?(\d{2,4})?/g, '') // Remove "2024", "2024-25", "2024/25"
        .replace(/\s+Series$/i, '')
        .trim();

    // Skip common filler words
    const skipWords = new Set(['of', 'the', 'and', 'for', 'in', 'at', 'to']);

    const words = withoutYear.split(/\s+/).filter(w => !skipWords.has(w.toLowerCase()));

    // Take first letter of each word, max 4 chars
    const abbreviation = words
        .map(w => w.charAt(0).toUpperCase())
        .join('')
        .slice(0, 4);

    return abbreviation || cleanName.slice(0, 4).toUpperCase();
}

/**
 * Get match format from tournament name or match type
 */
export function getMatchFormat(tournamentName: string | undefined, matchType?: string): string {
    const name = (tournamentName || '').toLowerCase();
    const type = (matchType || '').toLowerCase();

    // Check explicit match type first
    if (type.includes('t20') || type.includes('twenty20')) return 'T20';
    if (type.includes('odi') || type.includes('one day')) return 'ODI';
    if (type.includes('test')) return 'TEST';

    // Infer from tournament name
    if (name.includes('t20') || name.includes('twenty20') || name.includes('ipl') ||
        name.includes('big bash') || name.includes('hundred') || name.includes('sa20') ||
        name.includes('cpl') || name.includes('psl') || name.includes('bpl') ||
        name.includes('lpl') || name.includes('ilt20') || name.includes('wpl')) {
        return 'T20';
    }

    if (name.includes('odi') || name.includes('world cup') && !name.includes('t20')) {
        return 'ODI';
    }

    if (name.includes('test') || name.includes('ashes') || name.includes('border-gavaskar')) {
        return 'TEST';
    }

    return 'T20'; // Default to T20 if unknown
}
