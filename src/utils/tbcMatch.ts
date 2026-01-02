/**
 * TBC/Knockout Match Detection Utilities
 * Identifies matches with undetermined teams (playoffs, finals, qualifiers, etc.)
 */

import { Match } from '../types';

// Knockout event stages from API
const KNOCKOUT_STAGES = [
    'final',
    'semi_final',
    'quarter_final',
    'playoffs',
    'super_6',
    'super_six',
    'super_8'
];

// Knockout event name patterns (covers IPL Eliminator 1/2, Qualifier 1/2, etc.)
const KNOCKOUT_NAME_PATTERNS = [
    /^final$/i,
    /semi.?final/i,
    /quarter.?final/i,
    /eliminator/i,
    /qualifier/i,
    /play.?off/i,
    /super\s?(6|8|six|eight)/i,
    /challenger/i,
    /knockout/i,
    /plate\s?final/i,
    /preliminary/i
];

// Regex patterns for TBC/Placeholder team names
// Used for filtering and image fallback
export const TBC_NAME_PATTERNS = [
    /^(A|B|C|D)[1-4]$/i,      // A1, B2, D4 etc.
    /^(AD|BC)[1-2]$/i,        // AD1, BC2
    /^Qualifier(\s?\d+)?$/i,  // Qualifier, Qualifier 1
    /^Eliminator(\s?\d+)?$/i, // Eliminator, Eliminator 2
    /^Winner\s.*$/i,          // Winner ...
    /^Loser\s.*$/i,           // Loser ...
    /^T\.?B\.?C\.?$/i,        // TBC, T.B.C.
    /^T\.?B\.?D\.?$/i,        // TBD, T.B.D.
    /^Unknown$/i
];

/**
 * Check if a team name indicates a TBC/Placeholder team
 */
export const isTBCName = (name: string | undefined): boolean => {
    if (!name) return false;
    return TBC_NAME_PATTERNS.some(pattern => pattern.test(name));
};

/**
 * Check if either team has undetermined ID (id === "0")
 */
/**
 * Check if either team has undetermined ID (id === "0") or TBC name
 */
export const hasUndeterminedTeams = (match: Match): boolean => {
    const team1Id = match.participants?.[0]?.id;
    const team2Id = match.participants?.[1]?.id;
    const team1Name = match.participants?.[0]?.name;
    const team2Name = match.participants?.[1]?.name;

    return (
        team1Id === "0" ||
        team2Id === "0" ||
        isTBCName(team1Name) ||
        isTBCName(team2Name)
    );
};

/**
 * Check if match is in a knockout stage
 */
export const isKnockoutStage = (match: Match): boolean => {
    const stage = (match as any).event_stage || '';
    return KNOCKOUT_STAGES.includes(stage);
};

/**
 * Check if event name matches knockout patterns
 */
export const hasKnockoutEventName = (match: Match): boolean => {
    const eventName = match.event_name || '';
    return KNOCKOUT_NAME_PATTERNS.some(pattern => pattern.test(eventName));
};

/**
 * Comprehensive check: Is this a TBC/placeholder match?
 * Uses all three detection methods for maximum coverage
 */
export const isTBCMatch = (match: Match): boolean => {
    return hasUndeterminedTeams(match) || isKnockoutStage(match);
};

/**
 * Get display label for knockout match type
 */
export const getKnockoutLabel = (match: Match): string | null => {
    const eventName = match.event_name || '';
    const stage = (match as any).event_stage || '';

    // Priority: event_name (more specific) > event_stage
    if (eventName) {
        // Clean up common patterns
        if (/final$/i.test(eventName)) return eventName;
        if (/semi.?final/i.test(eventName)) return eventName;
        if (/quarter.?final/i.test(eventName)) return eventName;
        if (/eliminator/i.test(eventName)) return eventName;
        if (/qualifier/i.test(eventName)) return eventName;
        if (/play.?off/i.test(eventName)) return eventName;
    }

    // Fallback to stage
    switch (stage) {
        case 'final': return 'Final';
        case 'semi_final': return 'Semi-Final';
        case 'quarter_final': return 'Quarter-Final';
        case 'playoffs': return 'Playoff';
        case 'super_6':
        case 'super_six': return 'Super Six';
        case 'super_8': return 'Super 8';
        default: return null;
    }
};
