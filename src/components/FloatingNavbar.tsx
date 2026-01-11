import React, { useState, useEffect, useRef } from 'react';

export type NavTab = 'CRIC' | 'PLAY';

interface FloatingNavbarProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
}

/**
 * FloatingNavbar - Liquid Glass Dock with Auto-Hide on Scroll
 * 
 * Hides when scrolling down, reveals when scrolling up (like Safari chrome)
 */
const FloatingNavbar: React.FC<FloatingNavbarProps> = ({ activeTab, onTabChange }) => {
    const isCric = activeTab === 'CRIC';
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
        const handleScroll = () => {
            if (!ticking.current) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    const scrollDelta = currentScrollY - lastScrollY.current;

                    // Only trigger if scrolled more than 10px (debounce small movements)
                    if (Math.abs(scrollDelta) > 10) {
                        if (scrollDelta > 0 && currentScrollY > 100) {
                            // Scrolling DOWN and not at top - hide
                            setIsVisible(false);
                        } else if (scrollDelta < 0) {
                            // Scrolling UP - show
                            setIsVisible(true);
                        }
                        lastScrollY.current = currentScrollY;
                    }

                    // Always show if at top
                    if (currentScrollY < 50) {
                        setIsVisible(true);
                    }

                    ticking.current = false;
                });
                ticking.current = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav style={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: `translateX(-50%) translateY(${isVisible ? 0 : 100}px)`,
            opacity: isVisible ? 1 : 0,
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
            // Smooth transition
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
            pointerEvents: isVisible ? 'auto' : 'none',
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
