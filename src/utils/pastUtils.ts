/**
 * Past/Results Match Utilities
 * Time-based filtering for completed matches (Results section)
 */

import { Match } from '../types';

export type PastTimeFilterValue = 'all' | 'yesterday' | 'week';

/**
 * Check if a date is yesterday (local timezone)
 */
export function isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    );
}

/**
 * Check if a date is within the last 7 days
 */
export function wasLastWeek(date: Date): boolean {
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo && date <= now;
}

/**
 * Filter matches by past time context
 */
export function filterByPastTime(matches: Match[], timeFilter: PastTimeFilterValue): Match[] {
    if (timeFilter === 'all') return matches;

    return matches.filter(match => {
        const matchDate = new Date(match.start_date);

        switch (timeFilter) {
            case 'yesterday':
                return isYesterday(matchDate);
            case 'week':
                return wasLastWeek(matchDate);
            default:
                return true;
        }
    });
}

/**
 * Get a human-readable past day label for a date
 */
export function getPastDayLabel(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';

    // Format: "SAT, 4 JAN"
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    };
    return date.toLocaleDateString('en-US', options).toUpperCase();
}
