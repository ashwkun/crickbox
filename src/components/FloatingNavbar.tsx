import React from 'react';

export type NavTab = 'CRIC' | 'PLAY';

interface FloatingNavbarProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
}

/**
 * FloatingNavbar - Pure Liquid Glass Dock
 * 
 * Minimal, translucent, Apple-style design
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
            // Liquid Glass: Ultra-light translucent white
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            // Delicate border
            border: '1px solid rgba(255, 255, 255, 0.12)',
            // Soft ambient shadow
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
                    // Active: Subtle white pill
                    background: isCric
                        ? 'rgba(255, 255, 255, 0.15)'
                        : 'transparent',
                    transition: 'all 0.25s ease',
                }}
            >
                <span style={{
                    fontFamily: '"BBH Bartle", sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    // Active: Bright white, Inactive: Muted
                    color: isCric ? '#fff' : 'rgba(255, 255, 255, 0.45)',
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
                    // Active: Subtle white pill
                    background: !isCric
                        ? 'rgba(255, 255, 255, 0.15)'
                        : 'transparent',
                    transition: 'all 0.25s ease',
                }}
            >
                <span style={{
                    fontFamily: '"BBH Bartle", sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    // Active: Bright white, Inactive: Muted
                    color: !isCric ? '#fff' : 'rgba(255, 255, 255, 0.45)',
                    transition: 'color 0.25s ease',
                }}>
                    .PLAY
                </span>
            </button>
        </nav>
    );
};

export default FloatingNavbar;
