/**
 * Tournament Color Utility
 * Maps tournament names to brand accent colors for visual theming
 */

// Tournament-specific accent colors
const TOURNAMENT_COLORS: Record<string, string> = {
    // ICC Events
    'ICC World Twenty20': '#1D4ED8',      // Deep Blue
    'ICC Cricket World Cup': '#1D4ED8',
    'ICC Champions Trophy': '#7C3AED',    // Purple
    "ICC Women's World Twenty20": '#DB2777',
    "ICC Women's World Cup": '#DB2777',
    'ICC Under-19 World Cup': '#059669',  // Green
    'Asia Cup': '#F59E0B',                // Amber

    // Premium Leagues
    'Indian Premier League': '#2563EB',   // IPL Blue
    "Women's Premier League": '#BE185D',  // WPL Pink
    'Big Bash League': '#00979E',         // BBL Teal
    "Women's Big Bash League": '#00979E',
    'The Hundred': '#10B981',             // Emerald
    'SA20 league': '#16A34A',             // SA20 Green
    'SA20': '#16A34A',
    'ILT20': '#DC2626',                   // ILT20 Red
    'Pakistan Super League': '#22C55E',   // PSL Green
    'Caribbean Premier League': '#8B5CF6', // CPL Purple
    'Bangladesh Premier League': '#EA580C', // BPL Orange
    'Lanka Premier League': '#0284C7',    // LPL Blue
};

/**
 * Get accent color for a tournament
 * Returns a hex color string or default purple if not found
 */
export function getTournamentColor(tournamentName: string | undefined): string {
    if (!tournamentName) return '#7C3AED'; // Default purple

    const cleanName = tournamentName.toLowerCase();

    // Check direct match
    for (const [key, color] of Object.entries(TOURNAMENT_COLORS)) {
        if (cleanName.includes(key.toLowerCase())) {
            return color;
        }
    }

    // Default fallback
    return '#7C3AED';
}

/**
 * Get gradient CSS for tournament
 */
export function getTournamentGradient(tournamentName: string | undefined): string {
    const color = getTournamentColor(tournamentName);
    return `linear-gradient(135deg, ${color}33 0%, ${color}11 50%, transparent 100%)`;
}
