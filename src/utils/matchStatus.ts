// Status color mapping for live matches
export interface StatusConfig {
    text: string;
    color: string;
    bgColor: string;
}

export const getMatchStatusConfig = (shortEventStatus?: string): StatusConfig => {
    const status = (shortEventStatus || '').toLowerCase();

    // Play in progress - Green
    if (!status || status === 'in progress' || status === 'play in progress' || status === 'live') {
        return {
            text: 'LIVE',
            color: '#22c55e', // Green
            bgColor: 'rgba(34, 197, 94, 0.2)',
        };
    }

    // Session breaks - Orange/Amber
    if (status.includes('tea') || status.includes('lunch') || status.includes('dinner')) {
        return {
            text: status.charAt(0).toUpperCase() + status.slice(1),
            color: '#f97316', // Orange
            bgColor: 'rgba(249, 115, 22, 0.2)',
        };
    }

    // Innings break - Blue
    if (status.includes('innings break') || status.includes('inning break')) {
        return {
            text: 'Innings Break',
            color: '#3b82f6', // Blue
            bgColor: 'rgba(59, 130, 246, 0.2)',
        };
    }

    // Stumps / Day end - Purple
    if (status.includes('stumps') || status.includes('day') || status.includes('close')) {
        return {
            text: 'Stumps',
            color: '#a855f7', // Purple
            bgColor: 'rgba(168, 85, 247, 0.2)',
        };
    }

    // Drinks - Cyan
    if (status.includes('drinks') || status.includes('drink')) {
        return {
            text: 'Drinks',
            color: '#06b6d4', // Cyan
            bgColor: 'rgba(6, 182, 212, 0.2)',
        };
    }

    // Rain / Weather delay - Gray
    if (status.includes('rain') || status.includes('delay') || status.includes('weather')) {
        return {
            text: shortEventStatus || 'Delay',
            color: '#6b7280', // Gray
            bgColor: 'rgba(107, 114, 128, 0.2)',
        };
    }

    // Bad light / Other stoppages - Yellow
    if (status.includes('bad light') || status.includes('stopped')) {
        return {
            text: shortEventStatus || 'Stopped',
            color: '#eab308', // Yellow
            bgColor: 'rgba(234, 179, 8, 0.2)',
        };
    }

    // Default - Red (generic live state)
    return {
        text: shortEventStatus || 'LIVE',
        color: '#ef4444', // Red
        bgColor: 'rgba(239, 68, 68, 0.2)',
    };
};
