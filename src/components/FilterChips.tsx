import React from 'react';
import { Chip } from '../utils/matchPriority';

interface FilterChipsProps {
    chips: Chip[];
    activeChip: string;
    onChipClick: (chipId: string) => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({ chips, activeChip, onChipClick }) => {
    // Don't render if only "All" chip exists (nothing to filter)
    if (chips.length <= 1) return null;

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        padding: '0 20px 12px 20px',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
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
        // Glassmorphic styling
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

    return (
        <div style={containerStyle} className="filter-chips-scroll">
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

            {/* Hide scrollbar */}
            <style>{`
                .filter-chips-scroll::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default FilterChips;
