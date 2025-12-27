import React, { useState, useRef, useEffect } from 'react';
import { useRefresh } from '../contexts/RefreshContext';

const THRESHOLD = 60;

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
    const { triggerRefresh, isRefreshing, setIsRefreshing } = useRefresh();
    const [pullY, setPullY] = useState(0);
    const startY = useRef(0);
    const isPulling = useRef(false);

    // Reset after 3 seconds max
    useEffect(() => {
        if (isRefreshing) {
            const timer = setTimeout(() => setIsRefreshing(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isRefreshing, setIsRefreshing]);

    useEffect(() => {
        // Use native event listeners for better scroll handling
        const handleTouchStart = (e: TouchEvent) => {
            // Only engage if at very top of page
            if (window.scrollY <= 1 && !isRefreshing) {
                startY.current = e.touches[0].clientY;
                isPulling.current = false; // Will become true only on move down
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (isRefreshing) return;

            const currentY = e.touches[0].clientY;
            const diff = currentY - startY.current;

            // Only activate if at top and pulling down
            if (window.scrollY <= 1 && diff > 10) {
                isPulling.current = true;
                const pull = Math.min(diff * 0.35, 80);
                setPullY(pull);
            } else if (window.scrollY > 1) {
                // Scrolled away, cancel pull
                isPulling.current = false;
                setPullY(0);
            }
        };

        const handleTouchEnd = () => {
            if (isPulling.current && pullY >= THRESHOLD) {
                triggerRefresh();
            }
            isPulling.current = false;
            setPullY(0);
        };

        // Use passive: true to not block scrolling
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isRefreshing, pullY, triggerRefresh]);

    const showIndicator = pullY > 5 || isRefreshing;
    const indicatorHeight = isRefreshing ? 45 : pullY;

    return (
        <>
            {/* Fixed refresh indicator at top */}
            {showIndicator && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: indicatorHeight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    background: 'rgba(15, 15, 15, 0.95)',
                    transition: isPulling.current ? 'none' : 'height 0.15s ease-out'
                }}>
                    <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '2.5px solid rgba(59, 130, 246, 0.3)',
                        borderTopColor: '#3b82f6',
                        animation: isRefreshing ? 'ptr-spin 0.7s linear infinite' : 'none',
                        transform: isRefreshing ? undefined : `rotate(${(pullY / THRESHOLD) * 360}deg)`
                    }} />
                </div>
            )}

            {children}

            <style>{`@keyframes ptr-spin { to { transform: rotate(360deg); } }`}</style>
        </>
    );
}
