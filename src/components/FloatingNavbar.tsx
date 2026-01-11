import React, { useState, useEffect, useRef } from 'react';

export type NavTab = 'CRIC' | 'PLAY';

interface FloatingNavbarProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
}

/**
 * FloatingNavbar - Corner FAB with Shimmer + Auto-Hide
 */
const FloatingNavbar: React.FC<FloatingNavbarProps> = ({ activeTab, onTabChange }) => {
    const isCric = activeTab === 'CRIC';
    const targetTab = isCric ? 'PLAY' : 'CRIC';
    const targetColor = isCric ? '#ec4899' : '#22c55e';
    const targetColorLight = isCric ? '#f9a8d4' : '#86efac';

    // Auto-hide on scroll
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
        const handleScroll = () => {
            if (!ticking.current) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    const scrollDelta = currentScrollY - lastScrollY.current;

                    if (Math.abs(scrollDelta) > 10) {
                        if (scrollDelta > 0 && currentScrollY > 100) {
                            setIsVisible(false);
                        } else if (scrollDelta < 0) {
                            setIsVisible(true);
                        }
                        lastScrollY.current = currentScrollY;
                    }

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
        <>
            <style>{`
                @keyframes fabShimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: 0% 0; }
                }
            `}</style>

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
                    // Auto-hide transitions
                    transform: `translateY(${isVisible ? 0 : 100}px)`,
                    opacity: isVisible ? 1 : 0,
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                    pointerEvents: isVisible ? 'auto' : 'none',
                }}
            >
                {/* Arrow icon - diagonal */}
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
                        transform: isCric ? 'scaleX(1)' : 'scaleX(-1)',
                        transition: 'transform 0.3s ease',
                    }}
                >
                    {/* Diagonal arrow pointing top-right */}
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                </svg>

                {/* Label with shimmer */}
                <span
                    key={targetTab}
                    style={{
                        fontFamily: '"BBH Bartle", sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        background: `linear-gradient(90deg, ${targetColor} 0%, ${targetColor} 35%, ${targetColorLight} 50%, ${targetColor} 65%, ${targetColor} 100%)`,
                        backgroundSize: '200% 100%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'fabShimmer 2s ease-in-out infinite',
                    }}
                >
                    .{targetTab}
                </span>
            </button>
        </>
    );
};

export default FloatingNavbar;
