import React, { useState, useRef, useCallback } from 'react';
import { useRefresh } from '../contexts/RefreshContext';

interface PullToRefreshProps {
    children: React.ReactNode;
    disabled?: boolean;
}

const THRESHOLD = 70; // Pull distance to trigger refresh
const MAX_PULL = 100; // Maximum pull distance

export default function PullToRefresh({ children, disabled = false }: PullToRefreshProps) {
    const { triggerRefresh, isRefreshing } = useRefresh();
    const [pullY, setPullY] = useState(0);
    const startY = useRef(0);
    const pulling = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        if (disabled || isRefreshing) return;

        // Only start if scrolled to top
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        if (scrollTop > 0) return;

        startY.current = e.touches[0].clientY;
        pulling.current = true;
    }, [disabled, isRefreshing]);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (!pulling.current || disabled || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0) {
            // Diminishing returns - harder to pull further
            const pull = Math.min(diff * 0.4, MAX_PULL);
            setPullY(pull);
        }
    }, [disabled, isRefreshing]);

    const onTouchEnd = useCallback(() => {
        if (!pulling.current) return;
        pulling.current = false;

        if (pullY >= THRESHOLD && !isRefreshing) {
            triggerRefresh();
        }

        // Always reset pull distance
        setPullY(0);
    }, [pullY, isRefreshing, triggerRefresh]);

    const showIndicator = pullY > 10 || isRefreshing;
    const progress = Math.min(pullY / THRESHOLD, 1);

    return (
        <div
            ref={containerRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ position: 'relative' }}
        >
            {/* Refresh indicator */}
            {showIndicator && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: isRefreshing ? 50 : pullY,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    background: 'rgba(15, 15, 15, 0.95)',
                    transition: pulling.current ? 'none' : 'height 0.2s ease-out',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: '3px solid rgba(59, 130, 246, 0.3)',
                        borderTopColor: '#3b82f6',
                        transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
                        animation: isRefreshing ? 'ptr-spin 0.8s linear infinite' : 'none',
                        opacity: progress > 0.2 ? 1 : progress * 5
                    }} />
                </div>
            )}

            {/* Main content */}
            {children}

            <style>{`
                @keyframes ptr-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
