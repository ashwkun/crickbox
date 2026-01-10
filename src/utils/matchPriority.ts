/**
 * Match Priority & Filter Chip Utilities
 * Used for sorting live matches and generating filter chips
 */

import { Match } from '../types';

// Top 5 ICC Men's Teams (by ID)
const TOP_ICC_TEAMS = ['4', '1', '3', '13', '5'];
// IND=4, AUS=1, ENG=3, SA=13, NZ=5

// ICC World Cup Events (highest priority)
const ICC_WORLD_CUPS: Record<string, { priority: number; chip: string }> = {
    'ICC World Twenty20': { priority: 1, chip: 'T20 WC' },
    'ICC Cricket World Cup': { priority: 1, chip: 'ODI WC' },
    'ICC Champions Trophy': { priority: 1, chip: 'CT' },
    "ICC Women's World Twenty20": { priority: 1, chip: 'W-T20 WC' },
    "ICC Women's World Cup": { priority: 1, chip: 'W-ODI WC' },
    'ICC Under-19 World Cup': { priority: 2, chip: 'U19 WC' },
};

// Secondary ICC Events
const ICC_EVENTS: Record<string, { priority: number; chip: string }> = {
    'Under-19 Asia Cup': { priority: 2, chip: 'U19 Asia Cup' },
    'ACC Under-19 Asia Cup': { priority: 2, chip: 'U19 Asia Cup' },
    'Asia Cup': { priority: 3, chip: 'Asia Cup' },
    'Asia Cup T20I': { priority: 3, chip: 'Asia Cup' },
};

// Premium T20 Leagues
const PREMIUM_LEAGUES: Record<string, { priority: number; chip: string }> = {
    'Indian Premier League': { priority: 4, chip: 'IPL' },
    "Women's Premier League": { priority: 5, chip: 'WPL' },
    'Big Bash League': { priority: 6, chip: 'BBL' },
    "Women's Big Bash League": { priority: 7, chip: 'WBBL' },
    'The Hundred': { priority: 8, chip: 'The Hundred' },
    'The Hundred Women': { priority: 8, chip: 'The Hundred' },
    'SA20 league': { priority: 9, chip: 'SA20' },
    'ILT20': { priority: 10, chip: 'ILT20' },
    'Pakistan Super League': { priority: 11, chip: 'PSL' },
    'Caribbean Premier League': { priority: 12, chip: 'CPL' },
    'Bangladesh Premier League': { priority: 13, chip: 'BPL' },
    'Lanka Premier League': { priority: 14, chip: 'LPL' },
};

// Chip display order
const CHIP_ORDER = [
    // 1. Global Men's Events
    'all', 'featured', 'T20 WC', 'ODI WC', 'CT',

    // Explicit User Priority
    'IPL', 'WPL', 'International',

    // 2. Women's Global
    'W-T20 WC', 'W-ODI WC',

    // 4. Regional (International was moved up)
    'Asia Cup',

    // 5. Other Leagues (IPL/WPL moved up)
    'BBL', 'WBBL', 'The Hundred', 'SA20', 'ILT20', 'PSL', 'CPL', 'BPL', 'LPL',

    // 3. Youth (Moved down)
    'U19 WC', 'U19 Asia Cup',

    // 6. Catch-all
    "Women's", 'Youth', 'Domestic'
];

export interface Chip {
    id: string;
    label: string;
    count: number;
}

/**
 * Check if match involves a Top 10 ICC team
 */
function isTopTeamMatch(match: Match): boolean {
    const teamIds = match.participants?.map(p => p.id) || [];
    return teamIds.some(id => TOP_ICC_TEAMS.includes(id));
}

// Top Women's Teams (Sanitized Names)
const TOP_WOMENS_TEAMS = [
    'India W', 'Australia W', 'England W',
    'South Africa W', 'New Zealand W'
];

/**
 * Check if match involves a Top Women's team
 */
function isTopWomenTeamMatch(match: Match): boolean {
    const teamNames = match.participants?.map(p => p.name) || [];
    return teamNames.some(name => TOP_WOMENS_TEAMS.includes(name || ''));
}

/**
 * Get the chip category for a match
 */
export function getMatchChip(match: Match): string {
    const parentSeries = match.parent_series_name || '';
    const seriesName = match.series_name || '';
    const championship = match.championship_name || '';
    const leagueCode = match.league_code || '';
    const searchFields = [parentSeries, seriesName, championship];

    // 1. Check ICC World Cups
    for (const [name, config] of Object.entries(ICC_WORLD_CUPS)) {
        if (searchFields.some(f => f.includes(name))) {
            return config.chip;
        }
    }

    // 2. Check Secondary ICC Events
    for (const [name, config] of Object.entries(ICC_EVENTS)) {
        if (searchFields.some(f => f.includes(name))) {
            return config.chip;
        }
    }

    // 3. Check Premium Leagues (partial match on parent_series_name or series_name)
    for (const [name, config] of Object.entries(PREMIUM_LEAGUES)) {
        if (searchFields.some(f => f.includes(name))) {
            return config.chip;
        }
    }

    // 4. Categorize by league_code
    if (leagueCode === 'icc') {
        return 'International';
    }
    if (leagueCode === 'womens_international') {
        return "Women's";
    }
    if (leagueCode === 'youth_international') {
        return 'Youth';
    }

    // 5. Everything else is domestic
    return 'Domestic';
}

/**
 * Calculate match priority (lower = higher priority)
 */
export function getMatchPriority(match: Match): number {
    const parentSeries = match.parent_series_name || '';
    const seriesName = match.series_name || '';
    const championship = match.championship_name || '';
    const leagueCode = match.league_code || '';
    const searchFields = [parentSeries, seriesName, championship];
    const combined = searchFields.join(' ').toLowerCase();

    // EARLY DEMOTION: Warm-ups and Qualifiers get lower priority
    // They should appear in the app but sort below actual tournaments
    const isWarmupOrQualifier = combined.includes('warm-up') ||
        combined.includes('warm up') ||
        combined.includes('qualifier') ||
        combined.includes('warm up matches');

    // If warm-up/qualifier, return priority 18 (above domestic P100, below premium leagues P4-14)
    if (isWarmupOrQualifier) {
        return 18;
    }

    // 1. ICC World Cups = highest priority
    for (const [name, config] of Object.entries(ICC_WORLD_CUPS)) {
        if (searchFields.some(f => f.includes(name))) {
            return config.priority;
        }
    }

    // 2. Top 10 ICC team matches (bilateral internationals)
    if (leagueCode === 'icc' && isTopTeamMatch(match)) {
        return 2; // Above premium leagues
    }

    // 3. Secondary ICC events (Asia Cup, etc.)
    for (const [name, config] of Object.entries(ICC_EVENTS)) {
        if (searchFields.some(f => f.includes(name))) {
            return config.priority;
        }
    }

    // 4. Premium Leagues (partial match on parent_series_name or series_name)
    for (const [name, config] of Object.entries(PREMIUM_LEAGUES)) {
        if (searchFields.some(f => f.includes(name))) {
            return config.priority;
        }
    }

    // 5. Top Women's Teams (Bilateral)
    // Give them border-line priority (15) so they appear in Just Finished but sort below leagues
    if (isTopWomenTeamMatch(match)) {
        return 15;
    }

    // 6. Use API event_priority if available
    const apiPriority = parseInt(match.event_priority || '') || 999;
    if (apiPriority < 50) {
        return 15 + apiPriority; // Offset to keep below premium leagues
    }

    // 7. League-based fallback
    if (leagueCode === 'icc') return 20;
    if (leagueCode === 'womens_international') return 25;
    if (leagueCode === 'youth_international') return 30;

    // 8. Domestic/Other
    return 100;
}

/**
 * Sort matches by priority, then by start_date
 */
export function sortByPriority(matches: Match[]): Match[] {
    return [...matches].sort((a, b) => {
        // Primary: Priority (lower first)
        const priorityDiff = getMatchPriority(a) - getMatchPriority(b);
        if (priorityDiff !== 0) return priorityDiff;

        // Tie-breaker: Earlier start_date first
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        if (dateA !== dateB) return dateA - dateB;

        // Final: Preserve original order
        return 0;
    });
}

/**
 * Generate filter chips from match list
 * Only returns chips with at least 1 match
 */
export function generateChips(matches: Match[]): Chip[] {
    const chipCounts: Record<string, number> = { all: matches.length };

    for (const match of matches) {
        const chipId = getMatchChip(match);
        chipCounts[chipId] = (chipCounts[chipId] || 0) + 1;
    }

    // Build chip array
    const chips: Chip[] = Object.entries(chipCounts).map(([id, count]) => ({
        id,
        label: id === 'all' ? 'All' : id,
        count
    }));

    // Sort by predefined order
    chips.sort((a, b) => {
        const orderA = CHIP_ORDER.indexOf(a.id);
        const orderB = CHIP_ORDER.indexOf(b.id);
        // Unknown chips go to end
        return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
    });

    return chips;
}

/**
 * Generate filter chips for UPCOMING matches with smart sorting
 * Sorts by: Priority tier first, then by imminence within tier
 * This ensures high-priority categories stay at top while still surfacing imminent matches
 */
export function generateUpcomingChips(matches: Match[]): Chip[] {
    const chipData: Record<string, { count: number; earliestDate: Date; priorityTier: number }> = {};

    // Collect data for each chip
    for (const match of matches) {
        const chipId = getMatchChip(match);
        const matchDate = new Date(match.start_date);
        const priority = getMatchPriority(match);

        // Assign priority tier (groups of similar priority)
        // Tier 1: ICC Events (1-3)
        // Tier 2: Top Internationals + Premium Leagues (4-15)
        // Tier 3: Other International (16-30)
        // Tier 4: Domestic/Other (31+)
        let tier = 4;
        if (priority <= 3) tier = 1;
        else if (priority <= 15) tier = 2;
        else if (priority <= 30) tier = 3;

        if (!chipData[chipId]) {
            chipData[chipId] = {
                count: 0,
                earliestDate: matchDate,
                priorityTier: tier
            };
        }

        chipData[chipId].count++;
        if (matchDate < chipData[chipId].earliestDate) {
            chipData[chipId].earliestDate = matchDate;
        }
        // Use the best (lowest) tier for this chip
        if (tier < chipData[chipId].priorityTier) {
            chipData[chipId].priorityTier = tier;
        }
    }

    // Build chip array with metadata
    const chips: (Chip & { earliestDate: Date; priorityTier: number })[] =
        Object.entries(chipData).map(([id, data]) => ({
            id,
            label: id,
            count: data.count,
            earliestDate: data.earliestDate,
            priorityTier: data.priorityTier
        }));

    // Count featured matches
    const featuredCount = matches.filter(m => getMatchPriority(m) <= 15).length;

    // Add "All" chip at the start
    chips.unshift({
        id: 'all',
        label: 'All',
        count: matches.length,
        earliestDate: new Date(),
        priorityTier: 0
    });

    // Add "Featured" chip after All (if there are any)
    if (featuredCount > 0) {
        chips.splice(1, 0, {
            id: 'featured',
            label: 'Featured',
            count: featuredCount,
            earliestDate: new Date(),
            priorityTier: 0
        });
    }

    // Sort: Priority tier first, then earliestDate within tier
    // Sort: Explicit CHIP_ORDER
    chips.sort((a, b) => {
        const orderA = CHIP_ORDER.indexOf(a.id);
        const orderB = CHIP_ORDER.indexOf(b.id);

        // If both present in CHIP_ORDER, use that order
        if (orderA !== -1 && orderB !== -1) {
            return orderA - orderB;
        }

        // If one is missing, push it to end
        if (orderA === -1 && orderB !== -1) return 1;
        if (orderA !== -1 && orderB === -1) return -1;

        // If both missing (unknown categories), fallback to date sorting (imminence)
        return a.earliestDate.getTime() - b.earliestDate.getTime();
    });



    // Return only the Chip interface properties
    return chips.map(({ id, label, count }) => ({ id, label, count }));
}

/**
 * Filter matches by chip
 */
export function filterByChip(matches: Match[], chipId: string): Match[] {
    if (chipId === 'all') return matches;
    if (chipId === 'featured') return matches.filter(m => getMatchPriority(m) <= 15);
    return matches.filter(m => getMatchChip(m) === chipId);
}

/**
 * Check if match is featured (priority <= 15)
 */
export function isFeatured(match: Match): boolean {
    return getMatchPriority(match) <= 15;
}

/**
 * Filter for "Just Finished" section
 * Rules:
 * 1. Match is completed (event_state === 'R' or 'C')
 * 2. High Priority (<= 15: ICC, Top Int'l, Premium Leagues)
 * 3. Ended within last 12 hours
 */
export function filterJustFinished(matches: Match[]): Match[] {
    const now = Date.now();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;

    return matches.filter(match => {
        // 1. Must be completed
        // APIs use 'R' for results, sometimes 'C'
        if (match.event_state !== 'R' && match.event_state !== 'C') return false;

        // 2. High Priority Only
        // Top 10 Int'l (2) + ICC Events (1-3) + Premium Leagues (4-14)
        // Strictly exclude priority > 15 (Domestic, Lower Leagues)
        // Note: Top Women's Teams (India W, etc.) are now Priority 12 so they pass this check.
        if (getMatchPriority(match) > 15) return false;

        // 3. Recency Check
        // If end_date exists, use it. Otherwise skip (don't reliably know when it ended)
        if (!match.end_date) return false;

        const endTime = new Date(match.end_date).getTime();
        const timeSinceEnd = now - endTime;

        // Must be in the past (completed) and within 12 hours
        return timeSinceEnd >= 0 && timeSinceEnd <= TWELVE_HOURS;
    }).sort((a, b) => {
        // Sort most recently finished first
        const endA = a.end_date ? new Date(a.end_date).getTime() : 0;
        const endB = b.end_date ? new Date(b.end_date).getTime() : 0;
        return endB - endA;
    });
}

/**
 * Filter for ".FEAT" section
 * Featured matches in a 24-hour window (upcoming and completed only)
 * Live matches are shown in the Live section above, so excluded here
 * Returns: Upcoming 24hr + Completed 24hr (priority <= 15 only)
 */
export function filterFeatured24hr(matches: Match[]): Match[] {
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    const featured = matches.filter(match => {
        // Must be featured (priority <= 15)
        if (getMatchPriority(match) > 15) return false;

        // Skip live matches - they're shown in Live section
        if (match.event_state === 'L') return false;

        const startTime = new Date(match.start_date).getTime();

        // Upcoming within next 24 hours
        if (match.event_state === 'U') {
            const timeUntilStart = startTime - now;
            return timeUntilStart >= 0 && timeUntilStart <= TWENTY_FOUR_HOURS;
        }

        // Completed within last 24 hours
        if (match.event_state === 'R' || match.event_state === 'C') {
            if (!match.end_date) return false;
            const endTime = new Date(match.end_date).getTime();
            const timeSinceEnd = now - endTime;
            return timeSinceEnd >= 0 && timeSinceEnd <= TWENTY_FOUR_HOURS;
        }

        return false;
    });

    // Sort chronologically by proximity to now
    // Upcoming: use time until start
    // Completed: use time since end
    // Smaller distance = closer to now = first
    return featured.sort((a, b) => {
        const now = Date.now();

        // Calculate distance from now for each match
        const getDistanceFromNow = (match: Match): number => {
            if (match.event_state === 'U') {
                // Upcoming: time until start
                return new Date(match.start_date).getTime() - now;
            } else {
                // Completed: time since end (make positive for comparison)
                const endTime = match.end_date ? new Date(match.end_date).getTime() : 0;
                return now - endTime;
            }
        };

        return getDistanceFromNow(a) - getDistanceFromNow(b);
    });
}
