import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRefresh } from '../contexts/RefreshContext';

interface PullToRefreshProps {
    children: React.ReactNode;
    disabled?: boolean;
}

const PULL_THRESHOLD = 80; // Pixels to pull before triggering refresh
const RESISTANCE = 2.5; // How hard it is to pull (higher = harder)

export default function PullToRefresh({ children, disabled = false }: PullToRefreshProps) {
    const { triggerRefresh, isRefreshing, setIsRefreshing } = useRefresh();
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const currentY = useRef(0);

    // Reset after refresh completes
    useEffect(() => {
        if (!isRefreshing && pullDistance > 0) {
            // Animate back to 0
            const animateBack = () => {
                setPullDistance(prev => {
                    const next = prev - 10;
                    if (next <= 0) return 0;
                    requestAnimationFrame(animateBack);
                    return next;
                });
            };
            requestAnimationFrame(animateBack);
        }
    }, [isRefreshing, pullDistance]);

    // Auto-hide refreshing indicator after timeout
    useEffect(() => {
        if (isRefreshing) {
            const timeout = setTimeout(() => {
                setIsRefreshing(false);
            }, 3000); // Max 3 seconds refresh indicator
            return () => clearTimeout(timeout);
        }
    }, [isRefreshing, setIsRefreshing]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (disabled || isRefreshing) return;

        // Only start if at top of scroll
        const scrollTop = containerRef.current?.scrollTop || 0;
        if (scrollTop > 5) return;

        startY.current = e.touches[0].clientY;
        currentY.current = startY.current;
        setIsPulling(true);
    }, [disabled, isRefreshing]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling || disabled || isRefreshing) return;

        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;

        if (diff > 0) {
            // Apply resistance - pulling gets harder the further you go
            const distance = Math.min(diff / RESISTANCE, 120);
            setPullDistance(distance);

            // Prevent scroll when pulling down
            if (distance > 5) {
                e.preventDefault();
            }
        }
    }, [isPulling, disabled, isRefreshing]);

    const handleTouchEnd = useCallback(() => {
        if (!isPulling || disabled) return;

        setIsPulling(false);

        if (pullDistance >= PULL_THRESHOLD) {
            // Trigger refresh
            triggerRefresh();
            setPullDistance(PULL_THRESHOLD); // Hold at threshold during refresh
        } else {
            // Snap back
            setPullDistance(0);
        }
    }, [isPulling, pullDistance, disabled, triggerRefresh]);

    const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
    const rotation = progress * 360;
    const scale = 0.5 + (progress * 0.5);

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                position: 'relative',
                height: '100%',
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch'
            }}
        >
            {/* Pull indicator */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: pullDistance,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    transition: isPulling ? 'none' : 'height 0.2s ease-out',
                    zIndex: 100,
                    background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)'
                }}
            >
                {pullDistance > 10 && (
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            border: '3px solid transparent',
                            borderTopColor: '#3b82f6',
                            borderRightColor: progress >= 0.5 ? '#3b82f6' : 'transparent',
                            borderBottomColor: progress >= 0.75 ? '#3b82f6' : 'transparent',
                            borderLeftColor: progress >= 1 ? '#3b82f6' : 'transparent',
                            transform: `rotate(${rotation}deg) scale(${scale})`,
                            transition: isPulling ? 'none' : 'transform 0.2s ease-out',
                            animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none'
                        }}
                    />
                )}
            </div>

            {/* Content with transform */}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: isPulling ? 'none' : 'transform 0.2s ease-out'
                }}
            >
                {children}
            </div>

            {/* Keyframe animation for spinner */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
