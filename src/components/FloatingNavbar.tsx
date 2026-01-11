import React from 'react';

export type NavTab = 'CRIC' | 'PLAY';

interface FloatingNavbarProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
}

/**
 * FloatingNavbar - Liquid Glass Dock with Colored Tabs
 * 
 * Theme Colors:
 * - .CRIC: Electric Green (#22c55e)
 * - .PLAY: Hot Pink (#ec4899)
 */
const FloatingNavbar: React.FC<FloatingNavbarProps> = ({ activeTab, onTabChange }) => {
    const isCric = activeTab === 'CRIC';

    return (
        <nav style={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 5000,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: '4px',
            borderRadius: 50,
            // Liquid Glass
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}>
            {/* .CRIC Tab */}
            <button
                onClick={() => onTabChange('CRIC')}
                style={{
                    padding: '10px 22px',
                    borderRadius: 50,
                    border: 'none',
                    cursor: 'pointer',
                    background: isCric
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'transparent',
                    transition: 'all 0.25s ease',
                }}
            >
                <span style={{
                    fontFamily: '"BBH Bartle", sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    // Active: Green, Inactive: Muted
                    color: isCric ? '#22c55e' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'color 0.25s ease',
                }}>
                    .CRIC
                </span>
            </button>

            {/* .PLAY Tab */}
            <button
                onClick={() => onTabChange('PLAY')}
                style={{
                    padding: '10px 22px',
                    borderRadius: 50,
                    border: 'none',
                    cursor: 'pointer',
                    background: !isCric
                        ? 'rgba(236, 72, 153, 0.15)'
                        : 'transparent',
                    transition: 'all 0.25s ease',
                }}
            >
                <span style={{
                    fontFamily: '"BBH Bartle", sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    // Active: Pink, Inactive: Muted
                    color: !isCric ? '#ec4899' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'color 0.25s ease',
                }}>
                    .PLAY
                </span>
            </button>
        </nav>
    );
};

export default FloatingNavbar;
