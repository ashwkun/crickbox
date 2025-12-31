/**
 * Upcoming Match Utilities
 * Time-based filtering and priority sorting for upcoming matches
 */

import { Match } from '../types';
import { TimeFilterValue } from '../components/upcoming/TimeFilter';

/**
 * Check if a date is today (local timezone)
 */
export function isToday(date: Date): boolean {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
}

/**
 * Check if a date is tomorrow (local timezone)
 */
export function isTomorrow(date: Date): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
        date.getDate() === tomorrow.getDate() &&
        date.getMonth() === tomorrow.getMonth() &&
        date.getFullYear() === tomorrow.getFullYear()
    );
}

/**
 * Check if a date is within the next 7 days
 */
export function isThisWeek(date: Date): boolean {
    const now = new Date();
    const weekLater = new Date();
    weekLater.setDate(now.getDate() + 7);
    return date >= now && date <= weekLater;
}

/**
 * Check if a date is within the next 30 days
 */
export function isThisMonth(date: Date): boolean {
    const now = new Date();
    const monthLater = new Date();
    monthLater.setDate(now.getDate() + 30);
    return date >= now && date <= monthLater;
}

/**
 * Check if a date is within the next 60 days
 */
export function is60Days(date: Date): boolean {
    const now = new Date();
    const sixtyDaysLater = new Date();
    sixtyDaysLater.setDate(now.getDate() + 60);
    return date >= now && date <= sixtyDaysLater;
}

/**
 * Filter matches by time context
 */
export function filterByTime(matches: Match[], timeFilter: TimeFilterValue): Match[] {
    if (timeFilter === 'all') return matches;

    return matches.filter(match => {
        const matchDate = new Date(match.start_date);

        switch (timeFilter) {
            case 'today':
                return isToday(matchDate);
            case 'tomorrow':
                return isTomorrow(matchDate);
            case 'week':
                return isThisWeek(matchDate);
            case 'month':
                return isThisMonth(matchDate);
            case '60d':
                return is60Days(matchDate);
            default:
                return true;
        }
    });
}

/**
 * Get a human-readable day label for a date
 */
export function getDayLabel(date: Date): string {
    if (isToday(date)) return 'TODAY';
    if (isTomorrow(date)) return 'TOMORROW';

    // Format: "SAT, 4 JAN"
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    };
    return date.toLocaleDateString('en-US', options).toUpperCase();
}

/**
 * Group matches by date for list view
 */
export function groupMatchesByDate(matches: Match[]): Record<string, Match[]> {
    const groups: Record<string, Match[]> = {};

    matches.forEach(match => {
        const date = new Date(match.start_date);
        const label = getDayLabel(date);

        if (!groups[label]) {
            groups[label] = [];
        }
        groups[label].push(match);
    });

    return groups;
}
