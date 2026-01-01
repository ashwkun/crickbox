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
    const [isShrunk, setIsShrunk] = useState(false);

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    };

    // Collapsible .NEXT branding (same pattern as FilterChips .LIVE)
    const nextContainerStyle: React.CSSProperties = {
        position: 'relative',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        width: isShrunk ? '12px' : '80px',
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
        opacity: isShrunk ? 0 : 1,
        transform: isShrunk ? 'scale(0.5) translateX(-20px)' : 'scale(1) translateX(0)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transformOrigin: 'left center',
    };

    // Shrunk badge (indigo dot)
    const badgeStyle: React.CSSProperties = {
        position: 'absolute',
        left: 0,
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: '#6366f1',
        boxShadow: '0 0 10px rgba(99, 102, 241, 0.6)',
        opacity: isShrunk ? 1 : 0,
        transform: isShrunk ? 'scale(1)' : 'scale(0)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
    };

    const pulseRingStyle: React.CSSProperties = {
        position: 'absolute',
        left: '-3px',
        top: '-3px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        border: '1px solid rgba(99, 102, 241, 0.5)',
        opacity: isShrunk ? 1 : 0,
        transform: isShrunk ? 'scale(1)' : 'scale(0.5)',
        animation: isShrunk ? 'pulseRingIndigo 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
        transition: 'opacity 0.3s ease',
    };

    const chipsScrollStyle: React.CSSProperties = {
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        flex: 1,
        padding: '4px',
        marginLeft: '-4px',
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

    // Helper to determine if we should show the shrunk state
    // We only shrink if we have enough items to scroll
    const shouldEnableShrink = visibleOptions.length > 3;

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!shouldEnableShrink) return;
        const scrollLeft = e.currentTarget.scrollLeft;
        if (scrollLeft > 10 && !isShrunk) setIsShrunk(true);
        else if (scrollLeft <= 10 && isShrunk) setIsShrunk(false);
    };

    return (
        <div style={containerStyle}>
            <style>{`
                @keyframes nextShimmer {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                @keyframes pulseRingIndigo {
                    0% { transform: scale(0.8); opacity: 0.8; }
                    100% { transform: scale(2); opacity: 0; }
                }
                .time-filter-scroll::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Morpher Container - .NEXT */}
            <div style={nextContainerStyle}>
                <span style={textStyle}>.NEXT</span>
                <div style={{ ...badgeStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={pulseRingStyle} />
                </div>
            </div>

            {/* Chips */}
            <div
                style={chipsScrollStyle}
                className="time-filter-scroll"
                onScroll={handleScroll}
            >
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
