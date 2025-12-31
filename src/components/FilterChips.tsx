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
        padding: '0 20px 12px 20px',
    };

    const liveTextStyle: React.CSSProperties = {
        fontFamily: '"BBH Bartle", sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '1px',
        background: 'linear-gradient(90deg, #c53030 0%, #c53030 35%, #e87070 50%, #c53030 65%, #c53030 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'liveShimmer 1.5s ease-in-out infinite alternate',
        flexShrink: 0,
        transition: 'max-width 0.4s cubic-bezier(0.2, 0, 0, 1)', // Smooth ease-out
        maxWidth: isShrunk ? '20px' : '80px', // Use max-width for safer expansion
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        willChange: 'max-width',
    };

    const chipsScrollStyle: React.CSSProperties = {
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        flex: 1,
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
            ? 'rgba(255, 255, 255, 0.95)'
            : 'rgba(20, 20, 20, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isActive
            ? '1px solid rgba(255, 255, 255, 0.3)'
            : '1px solid rgba(255, 255, 255, 0.15)',
        color: isActive ? '#000' : '#fff',
        boxShadow: isActive
            ? '0 4px 16px rgba(255, 255, 255, 0.1)'
            : '0 4px 16px rgba(0, 0, 0, 0.2)',
    });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollLeft = e.currentTarget.scrollLeft;
        // Shrink after 10px to feel more responsive
        if (scrollLeft > 10 && !isShrunk) {
            setIsShrunk(true);
        } else if (scrollLeft <= 10 && isShrunk) {
            setIsShrunk(false);
        }
    };

    return (
        <div style={containerStyle}>
            {/* Shimmer keyframes */}
            <style>{`
                @keyframes liveShimmer {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                .filter-chips-scroll::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            {/* Frozen .LIVE text - Animates via width clipping */}
            <span style={liveTextStyle}>.LIVE</span>

            {/* Scrollable chips */}
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
                            <span style={{
                                marginLeft: '6px',
                                opacity: 0.6,
                                fontSize: '11px'
                            }}>
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
