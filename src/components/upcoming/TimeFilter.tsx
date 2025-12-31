/**
 * TimeFilter - Horizontal chip bar for filtering matches by time context
 * Used in Upcoming section to filter by All, Today, Tomorrow, Week, Month
 */

import React from 'react';

export type TimeFilterValue = 'all' | 'today' | 'tomorrow' | 'week' | 'month';

interface TimeFilterProps {
    value: TimeFilterValue;
    onChange: (value: TimeFilterValue) => void;
}

const OPTIONS: { value: TimeFilterValue; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
];

const TimeFilter: React.FC<TimeFilterProps> = ({ value, onChange }) => {
    const containerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
    };

    const chipStyle = (isSelected: boolean): React.CSSProperties => ({
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        background: isSelected
            ? 'rgba(99, 102, 241, 0.2)'
            : 'rgba(255, 255, 255, 0.05)',
        border: isSelected
            ? '1px solid rgba(99, 102, 241, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        color: isSelected ? '#a5b4fc' : 'rgba(255, 255, 255, 0.6)',
        transition: 'all 0.2s ease',
        flexShrink: 0,
    });

    return (
        <div style={containerStyle}>
            <style>{`
                .time-filter-container::-webkit-scrollbar { display: none; }
            `}</style>
            {OPTIONS.map(option => (
                <div
                    key={option.value}
                    style={chipStyle(option.value === value)}
                    onClick={() => onChange(option.value)}
                >
                    {option.label}
                </div>
            ))}
        </div>
    );
};

export default TimeFilter;
