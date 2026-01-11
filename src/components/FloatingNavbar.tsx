import React from 'react';

export type NavTab = 'CRIC' | 'PLAY';

interface FloatingNavbarProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
}

/**
 * FloatingNavbar - Corner FAB Style
 * 
 * Minimal pill in bottom-right corner showing the "other" section
 * Liquid glass styling with theme colors
 */
const FloatingNavbar: React.FC<FloatingNavbarProps> = ({ activeTab, onTabChange }) => {
    const isCric = activeTab === 'CRIC';
    const targetTab = isCric ? 'PLAY' : 'CRIC';
    const targetColor = isCric ? '#ec4899' : '#22c55e'; // Pink for PLAY, Green for CRIC
    const targetBg = isCric ? 'rgba(236, 72, 153, 0.15)' : 'rgba(34, 197, 94, 0.15)';

    return (
        <button
            onClick={() => onTabChange(targetTab)}
            style={{
                position: 'fixed',
                bottom: 28,
                right: 16,
                zIndex: 5000,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 18px',
                borderRadius: 50,
                border: 'none',
                cursor: 'pointer',
                // Liquid Glass
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s ease',
            }}
        >
            {/* Arrow icon */}
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={targetColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    transform: isCric ? 'rotate(45deg)' : 'rotate(-135deg)',
                    transition: 'transform 0.3s ease',
                }}
            >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
            </svg>

            {/* Label */}
            <span style={{
                fontFamily: '"BBH Bartle", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: targetColor,
            }}>
                .{targetTab}
            </span>
        </button>
    );
};

export default FloatingNavbar;
