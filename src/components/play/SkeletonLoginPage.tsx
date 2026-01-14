import React from 'react';

/**
 * SkeletonLoginPage - Shimmer loading state for Login Page
 * 
 * Mimics the layout of the actual Login Page using standard shimmer skeletons.
 * Replaces the spinner with a skeleton UI as requested.
 */
const SkeletonLoginPage = () => {
    return (
        <div style={{
            minHeight: 'calc(100vh - 85px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px 120px',
            textAlign: 'center',
            width: '100%'
        }}>
            {/* Shimmer Animation Styles - reusing from cards.css concepts */}
            <style>{`
                .skeleton-shimmer {
                    background: #1a1a1a;
                    position: relative;
                    overflow: hidden;
                }
                .skeleton-shimmer::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(255, 255, 255, 0.05) 50%,
                        transparent 100%
                    );
                    animation: shimmer 1.5s infinite;
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>

            {/* Icon Skeleton */}
            <div className="skeleton-shimmer" style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                marginBottom: 24,
            }} />

            {/* Title Skeleton */}
            <div className="skeleton-shimmer" style={{
                width: 200,
                height: 32,
                borderRadius: 8,
                marginBottom: 12,
            }} />

            {/* Subtitle Skeleton */}
            <div className="skeleton-shimmer" style={{
                width: 260,
                height: 20,
                borderRadius: 6,
                marginBottom: 8,
            }} />
            <div className="skeleton-shimmer" style={{
                width: 180,
                height: 20,
                borderRadius: 6,
                marginBottom: 32,
            }} />

            {/* Google Button Skeleton */}
            <div className="skeleton-shimmer" style={{
                width: '100%',
                maxWidth: 300,
                height: 48,
                borderRadius: 12,
                marginBottom: 16,
            }} />

            {/* Divider Skeleton */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: 300,
                margin: '8px 0 24px',
                gap: 16
            }}>
                <div className="skeleton-shimmer" style={{ flex: 1, height: 1 }} />
                <div className="skeleton-shimmer" style={{ width: 20, height: 12, borderRadius: 2 }} />
                <div className="skeleton-shimmer" style={{ flex: 1, height: 1 }} />
            </div>

            {/* Email Input Skeleton */}
            <div style={{
                display: 'flex',
                gap: 8,
                width: '100%',
                maxWidth: 300,
            }}>
                <div className="skeleton-shimmer" style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 12,
                }} />
                <div className="skeleton-shimmer" style={{
                    width: 50,
                    height: 48,
                    borderRadius: 12,
                }} />
            </div>
        </div>
    );
};

export default SkeletonLoginPage;
