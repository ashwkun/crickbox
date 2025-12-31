import React from 'react';
import { Chip } from '../utils/matchPriority';

interface FilterChipsProps {
    chips: Chip[];
    activeChip: string;
    onChipClick: (chipId: string) => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({ chips, activeChip, onChipClick }) => {
    const [isShrunk, setIsShrunk] = React.useState(false);

    // Don't render if only "All" chip exists (nothing to filter)
    if (chips.length <= 1) return null;

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px', // Increased gap for better separation
        padding: '0 20px 8px 16px', // Reduced left/bottom to account for scroll padding
    };

    const liveContainerStyle: React.CSSProperties = {
        position: 'relative',
        height: '28px', // Slightly taller for pill effect
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        width: isShrunk ? '28px' : '80px', // Square pill when shrunk, wide when expanded
        // Glassmorphic background for both states, but more opaque when shrunk if desired
        background: isShrunk
            ? 'rgba(255, 255, 255, 0.15)'
            : 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '100px',
        border: isShrunk
            ? '1px solid rgba(255, 255, 255, 0.2)'
            : '1px solid rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
    };

    const textStyle: React.CSSProperties = {
        fontFamily: '"BBH Bartle", sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '1px',
        // Solid Red Color always
        color: '#ff4d4d', // Bright red that stands out on glass
        whiteSpace: 'nowrap',
        transition: 'all 0.4s ease',
        transform: isShrunk ? 'scale(0.95)' : 'scale(1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        paddingTop: isShrunk ? '1px' : '0', // Optical adjustment
        // Remove old gradient props
    };

    const chipsScrollStyle: React.CSSProperties = {
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        flex: 1,
        padding: '4px',
        marginLeft: '4px',
    };

    const chipStyle = (isActive: boolean): React.CSSProperties => ({
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: isActive ? 600 : 500,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'all 0.2s ease',
        background: isActive
            ? 'rgba(255, 255, 255, 0.15)'
            : 'rgba(20, 20, 20, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isActive
            ? '1px solid rgba(255, 255, 255, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.15)',
        color: '#fff',
        boxShadow: isActive ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.2)',
    });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollLeft = e.currentTarget.scrollLeft;
        if (scrollLeft > 10 && !isShrunk) setIsShrunk(true);
        else if (scrollLeft <= 10 && isShrunk) setIsShrunk(false);
    };

    return (
        <div style={containerStyle}>
            <style>{`
                @keyframes liveShimmer {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                .filter-chips-scroll::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Pill Container */}
            <div style={liveContainerStyle}>
                <span style={textStyle}>
                    {isShrunk ? 'L' : '.LIVE'}
                </span>
            </div>

            <div
                style={chipsScrollStyle}
                className="filter-chips-scroll"
                onScroll={handleScroll}
            >
                {chips.map(chip => (
                    <div
                        key={chip.id}
                        style={chipStyle(chip.id === activeChip)}
                        onClick={() => onChipClick(chip.id)}
                    >
                        {chip.label}
                        {chip.id !== 'all' && (
                            <span style={{ marginLeft: '6px', opacity: 0.6, fontSize: '11px' }}>
                                {chip.count}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FilterChips;
