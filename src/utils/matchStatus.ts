// Status color mapping for live matches
export interface StatusConfig {
    text: string;
    color: string;
    bgColor: string;
    isLive: boolean; // true = actively playing, false = break/delay
}

// Known break/delay statuses
const BREAK_KEYWORDS = [
    'tea', 'lunch', 'dinner', 'drinks', 'drink',
    'stumps', 'close of play', 'end of day',
    'innings break', 'inning break',
    'rain', 'delay', 'weather',
    'bad light', 'stopped'
];

// Check if match is in a break/delay state
export const isMatchInBreak = (eventStatus?: string, shortEventStatus?: string): boolean => {
    const status = ((eventStatus || '') + ' ' + (shortEventStatus || '')).toLowerCase();
    return BREAK_KEYWORDS.some(keyword => status.includes(keyword));
};

export const getMatchStatusConfig = (shortEventStatus?: string, eventStatus?: string): StatusConfig => {
    const status = (shortEventStatus || eventStatus || '').toLowerCase();
    const isBreak = isMatchInBreak(eventStatus, shortEventStatus);

    // Play in progress - Green (pulsing)
    if (!isBreak) {
        return {
            text: 'LIVE',
            color: '#22c55e', // Green
            bgColor: 'rgba(34, 197, 94, 0.2)',
            isLive: true,
        };
    }

    // Session breaks - Orange/Amber
    if (status.includes('tea') || status.includes('lunch') || status.includes('dinner')) {
        const breakType = status.includes('tea') ? 'Tea' : status.includes('lunch') ? 'Lunch' : 'Dinner';
        return {
            text: breakType,
            color: '#f97316', // Orange
            bgColor: 'rgba(249, 115, 22, 0.2)',
            isLive: false,
        };
    }

    // Innings break - Blue
    if (status.includes('innings break') || status.includes('inning break')) {
        return {
            text: 'Innings Break',
            color: '#3b82f6', // Blue
            bgColor: 'rgba(59, 130, 246, 0.2)',
            isLive: false,
        };
    }

    // Stumps / Day end - Purple
    if (status.includes('stumps') || status.includes('day') || status.includes('close')) {
        return {
            text: 'Stumps',
            color: '#a855f7', // Purple
            bgColor: 'rgba(168, 85, 247, 0.2)',
            isLive: false,
        };
    }

    // Drinks - Cyan
    if (status.includes('drinks') || status.includes('drink')) {
        return {
            text: 'Drinks',
            color: '#06b6d4', // Cyan
            bgColor: 'rgba(6, 182, 212, 0.2)',
            isLive: false,
        };
    }

    // Rain / Weather delay - Gray
    if (status.includes('rain') || status.includes('delay') || status.includes('weather')) {
        return {
            text: shortEventStatus || 'Delay',
            color: '#6b7280', // Gray
            bgColor: 'rgba(107, 114, 128, 0.2)',
            isLive: false,
        };
    }

    // Bad light / Other stoppages - Yellow
    if (status.includes('bad light') || status.includes('stopped')) {
        return {
            text: shortEventStatus || 'Stopped',
            color: '#eab308', // Yellow
            bgColor: 'rgba(234, 179, 8, 0.2)',
            isLive: false,
        };
    }

    // Default - Green (assume playing if not recognized as break)
    return {
        text: 'LIVE',
        color: '#22c55e', // Green
        bgColor: 'rgba(34, 197, 94, 0.2)',
        isLive: true,
    };
};
