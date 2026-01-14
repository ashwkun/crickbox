import React from 'react';

/**
 * SkeletonLoginPage - Shimmer loading state for Login Page
 * 
 * Mimics the layout of the actual Glassmorphic Login Page using standard shimmer skeletons.
 */
const SkeletonLoginPage = () => {
    return (
        <div style={{
            minHeight: 'calc(100vh - 85px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            width: '100%'
        }}>
            {/* Shimmer Animation Styles */}
            <style>{`
                .skeleton-shimmer {
                    background: rgba(255, 255, 255, 0.05);
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

            {/* Glassmorphic Card Construction */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 24,
                padding: '40px 32px',
                width: '100%',
                maxWidth: 360,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Title Skeletons */}
                <div className="skeleton-shimmer" style={{
                    width: 80,
                    height: 24,
                    borderRadius: 6,
                    marginBottom: 8,
                }} />
                <div className="skeleton-shimmer" style={{
                    width: 140,
                    height: 48,
                    borderRadius: 8,
                    marginBottom: 12,
                }} />

                {/* Subtitle Skeleton */}
                <div className="skeleton-shimmer" style={{
                    width: 200,
                    height: 16,
                    borderRadius: 4,
                    marginBottom: 32,
                }} />

                {/* Google Button Skeleton */}
                <div className="skeleton-shimmer" style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 16,
                    marginBottom: 20,
                }} />

                {/* Divider Skeleton */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    gap: 12,
                    marginBottom: 20,
                }}>
                    <div className="skeleton-shimmer" style={{ flex: 1, height: 1 }} />
                    <div className="skeleton-shimmer" style={{ width: 60, height: 12, borderRadius: 2 }} />
                    <div className="skeleton-shimmer" style={{ flex: 1, height: 1 }} />
                </div>

                {/* Email Input Skeleton */}
                <div className="skeleton-shimmer" style={{
                    width: '100%',
                    height: 54,
                    borderRadius: 16,
                }} />
            </div>
        </div>
    );
};

export default SkeletonLoginPage;
