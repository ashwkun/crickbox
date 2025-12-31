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
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy wow effect
        width: isShrunk ? '12px' : '80px',
    };

    const textStyle: React.CSSProperties = {
        fontFamily: '"BBH Bartle", sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '1px',
        background: 'linear-gradient(90deg, #c53030 0%, #c53030 35%, #e87070 50%, #c53030 65%, #c53030 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'liveShimmer 1.5s ease-in-out infinite alternate',
        position: 'absolute',
        left: 0,
        whiteSpace: 'nowrap',
        opacity: isShrunk ? 0 : 1,
        transform: isShrunk ? 'scale(0.5) translateX(-20px)' : 'scale(1) translateX(0)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transformOrigin: 'left center',
    };

    const badgeStyle: React.CSSProperties = {
        position: 'absolute',
        left: 0,
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: '#e53e3e',
        boxShadow: '0 0 10px rgba(229, 62, 62, 0.6)',
        opacity: isShrunk ? 1 : 0,
        transform: isShrunk ? 'scale(1)' : 'scale(0)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s', // Slight delay for pop-in
    };

    const pulseRingStyle: React.CSSProperties = {
        position: 'absolute',
        left: '-3px',
        top: '-3px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        border: '1px solid rgba(229, 62, 62, 0.5)',
        opacity: isShrunk ? 1 : 0,
        transform: isShrunk ? 'scale(1)' : 'scale(0.5)',
        animation: isShrunk ? 'pulseRing 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
        transition: 'opacity 0.3s ease',
    };

    const chipsScrollStyle: React.CSSProperties = {
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        flex: 1,
        padding: '4px',
        marginLeft: '-4px',
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
            ? 'rgba(197, 48, 48, 0.2)'  // Red hue for Live
            : 'rgba(20, 20, 20, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isActive
            ? '1px solid rgba(197, 48, 48, 0.4)'  // Red border
            : '1px solid rgba(255, 255, 255, 0.15)',
        color: isActive ? '#fca5a5' : '#fff',  // Light red text when active
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
                @keyframes pulseRing {
                    0% { transform: scale(0.8); opacity: 0.8; }
                    100% { transform: scale(2); opacity: 0; }
                }
                .filter-chips-scroll::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Morpher Container */}
            <div style={liveContainerStyle}>
                <span style={textStyle}>.LIVE</span>
                <div style={{ ...badgeStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={pulseRingStyle} />
                </div>
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
