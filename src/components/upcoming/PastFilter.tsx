/**
 * PastFilter - Horizontal chip bar with .PAST branding
 * Used in Results section to filter by All, Yesterday, 7 Days
 */

import React from 'react';
import { PastTimeFilterValue } from '../../utils/pastUtils';

interface PastFilterProps {
    value: PastTimeFilterValue;
    onChange: (value: PastTimeFilterValue) => void;
    onPastClick?: () => void; // Optional: callback when .PAST is tapped
}

const OPTIONS: { value: PastTimeFilterValue; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: '7 Days' },
];

const PastFilter: React.FC<PastFilterProps> = ({ value, onChange, onPastClick }) => {
    const containerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    };

    // Static .PAST branding - tappable
    const pastContainerStyle: React.CSSProperties = {
        position: 'relative',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        width: '80px',
        cursor: onPastClick ? 'pointer' : 'default',
    };

    const textStyle: React.CSSProperties = {
        fontFamily: '"BBH Bartle", sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '1px',
        background: 'linear-gradient(90deg, #f59e0b 0%, #f59e0b 35%, #fcd34d 50%, #f59e0b 65%, #f59e0b 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'pastShimmer 1.5s ease-in-out infinite alternate',
        position: 'absolute',
        left: 0,
        whiteSpace: 'nowrap',
        opacity: 1,
        transform: 'scale(1) translateX(0)',
        transformOrigin: 'left center',
    };

    const chipsScrollStyle: React.CSSProperties = {
        display: 'flex',
        gap: '6px',
        flex: 1,
        padding: '4px 0 4px 0',
        marginLeft: '0',
        justifyContent: 'flex-end',
    };

    const chipStyle = (isSelected: boolean): React.CSSProperties => ({
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        background: isSelected
            ? 'rgba(245, 158, 11, 0.2)'
            : 'rgba(255, 255, 255, 0.05)',
        border: isSelected
            ? '1px solid rgba(245, 158, 11, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        color: isSelected ? '#fcd34d' : 'rgba(255, 255, 255, 0.6)',
        transition: 'all 0.2s ease',
        flexShrink: 0,
    });

    return (
        <div style={containerStyle}>
            <style>{`
                @keyframes pastShimmer {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
            `}</style>

            {/* Static .PAST branding - tappable */}
            <div style={pastContainerStyle} onClick={onPastClick}>
                <span style={textStyle}>.PAST</span>
            </div>

            {/* Chips */}
            <div style={chipsScrollStyle}>
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
        </div>
    );
};

export default PastFilter;
