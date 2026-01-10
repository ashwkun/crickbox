/**
 * Past/Results Match Utilities
 * Time-based filtering for completed matches (Results section)
 */

import { Match } from '../types';
import { isToday } from './upcomingUtils';

export type PastTimeFilterValue = 'all' | 'today' | 'yesterday' | 'week';

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
        // For Test matches (and First Class), use end_date for filtering context
        // This ensures a test match that finished today shows in "Today" even if it started 5 days ago
        let dateToUse = match.start_date;
        const isTest = match.event_format?.includes('TEST') || match.event_format?.includes('FC') || match.event_format?.includes('First Class');

        if (isTest && match.end_date) {
            dateToUse = match.end_date;
        } else if (isTest && !match.end_date && match.event_state === 'L') {
            // Live test match, use today for filtering so it shows in 'today' tab?
            // Actually results section is for completed matches mainly. 
            // If completed but no end_date, fallback to start_date.
        }

        const matchDate = new Date(dateToUse);

        switch (timeFilter) {
            case 'today':
                return isToday(matchDate);
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
