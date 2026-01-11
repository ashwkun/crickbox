import React from 'react';

export type NavTab = 'CRIC' | 'PLAY';

interface FloatingNavbarProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
}

/**
 * FloatingNavbar - Premium Glass Dock for switching between .CRIC and .PLAY
 * 
 * Theme Colors:
 * - .CRIC: Electric Green (#22c55e)
 * - .PLAY: Hot Pink (#ec4899)
 */
const FloatingNavbar: React.FC<FloatingNavbarProps> = ({ activeTab, onTabChange }) => {
    const isCric = activeTab === 'CRIC';

    return (
        <>
            <style>{`
                @keyframes navShimmer {
                    0% { background-position: 100% 0; }
                    100% { background-position: 0% 0; }
                }
            `}</style>

            <nav style={{
                position: 'fixed',
                bottom: 30,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 5000,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 8px',
                borderRadius: 100,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.03) inset',
            }}>
                {/* .CRIC Tab */}
                <button
                    onClick={() => onTabChange('CRIC')}
                    style={{
                        position: 'relative',
                        padding: '10px 20px',
                        borderRadius: 100,
                        border: 'none',
                        cursor: 'pointer',
                        background: isCric
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'transparent',
                        transition: 'background 0.3s ease',
                    }}
                >
                    {/* Active: Gradient text with shimmer */}
                    {isCric ? (
                        <span style={{
                            fontFamily: '"BBH Bartle", sans-serif',
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            background: 'linear-gradient(90deg, #22c55e 0%, #22c55e 35%, #86efac 50%, #22c55e 65%, #22c55e 100%)',
                            backgroundSize: '200% 100%',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            animation: 'navShimmer 2s ease-in-out infinite alternate',
                        }}>
                            .CRIC
                        </span>
                    ) : (
                        /* Inactive: Solid grey color (no gradient) */
                        <span style={{
                            fontFamily: '"BBH Bartle", sans-serif',
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            color: 'rgba(255, 255, 255, 0.4)',
                        }}>
                            .CRIC
                        </span>
                    )}

                    {/* Glow Effect */}
                    {isCric && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 100,
                            background: 'radial-gradient(circle at center, rgba(34, 197, 94, 0.2), transparent 70%)',
                            pointerEvents: 'none',
                        }} />
                    )}
                </button>

                {/* Divider */}
                <div style={{
                    width: 1,
                    height: 20,
                    background: 'rgba(255, 255, 255, 0.1)',
                    flexShrink: 0,
                }} />

                {/* .PLAY Tab */}
                <button
                    onClick={() => onTabChange('PLAY')}
                    style={{
                        position: 'relative',
                        padding: '10px 20px',
                        borderRadius: 100,
                        border: 'none',
                        cursor: 'pointer',
                        background: !isCric
                            ? 'rgba(236, 72, 153, 0.15)'
                            : 'transparent',
                        transition: 'background 0.3s ease',
                    }}
                >
                    {/* Active: Gradient text with shimmer */}
                    {!isCric ? (
                        <span style={{
                            fontFamily: '"BBH Bartle", sans-serif',
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            background: 'linear-gradient(90deg, #ec4899 0%, #ec4899 35%, #f9a8d4 50%, #ec4899 65%, #ec4899 100%)',
                            backgroundSize: '200% 100%',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            animation: 'navShimmer 2s ease-in-out infinite alternate',
                        }}>
                            .PLAY
                        </span>
                    ) : (
                        /* Inactive: Solid grey color (no gradient) */
                        <span style={{
                            fontFamily: '"BBH Bartle", sans-serif',
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            color: 'rgba(255, 255, 255, 0.4)',
                        }}>
                            .PLAY
                        </span>
                    )}

                    {/* Glow Effect */}
                    {!isCric && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 100,
                            background: 'radial-gradient(circle at center, rgba(236, 72, 153, 0.2), transparent 70%)',
                            pointerEvents: 'none',
                        }} />
                    )}
                </button>
            </nav>
        </>
    );
};

export default FloatingNavbar;
