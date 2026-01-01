/**
 * TimeFilter - Horizontal chip bar with collapsible .NEXT branding
 * Used in Upcoming section to filter by All, Today, Tomorrow, 7 Days, 30 Days, 60 Days
 */

import React, { useState } from 'react';

export type TimeFilterValue = 'all' | 'today' | 'tomorrow' | 'week' | 'month' | '60d';

interface TimeFilterProps {
    value: TimeFilterValue;
    onChange: (value: TimeFilterValue) => void;
    allowedFilters?: TimeFilterValue[];
}

const ALL_OPTIONS: { value: TimeFilterValue; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: '7 Days' },
    { value: 'month', label: '30 Days' },
    { value: '60d', label: '60 Days' },
];

const TimeFilter: React.FC<TimeFilterProps> = ({ value, onChange, allowedFilters }) => {
    // Scroll and shrink logic removed as chips now fit on screen

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    };

    // Static .NEXT branding
    const nextContainerStyle: React.CSSProperties = {
        position: 'relative',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        width: '80px',
    };

    const textStyle: React.CSSProperties = {
        fontFamily: '"BBH Bartle", sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '1px',
        background: 'linear-gradient(90deg, #6366f1 0%, #6366f1 35%, #a5b4fc 50%, #6366f1 65%, #6366f1 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'nextShimmer 1.5s ease-in-out infinite alternate',
        position: 'absolute',
        left: 0,
        whiteSpace: 'nowrap',
        opacity: 1,
        transform: 'scale(1) translateX(0)',
        transformOrigin: 'left center',
    };

    // Shrunk badge (Hidden now)
    const badgeStyle: React.CSSProperties = {
        display: 'none',
    };

    const chipsScrollStyle: React.CSSProperties = {
        display: 'flex',
        gap: '6px',
        flex: 1,
        padding: '4px 0 4px 0',
        marginLeft: '0',
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

    const visibleOptions = allowedFilters
        ? ALL_OPTIONS.filter(opt => allowedFilters.includes(opt.value))
        : ALL_OPTIONS;

    return (
        <div style={containerStyle}>
            <style>{`
                @keyframes nextShimmer {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
            `}</style>

            {/* Static .NEXT branding */}
            <div style={nextContainerStyle}>
                <span style={textStyle}>.NEXT</span>
            </div>

            {/* Chips (No scroll) */}
            <div style={chipsScrollStyle}>
                {visibleOptions.map(option => (
                    <div
                        key={option.value}
                        style={chipStyle(option.value === value)}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimeFilter;
