import React from 'react';

interface FloatingHeaderProps {
    showBack: boolean;
    onBack: () => void;
    onLogoClick?: () => void;
    centerContent?: React.ReactNode;
}

const FloatingHeader: React.FC<FloatingHeaderProps> = ({ showBack, onBack, onLogoClick, centerContent }) => {
    // Styles for the floating container
    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr', // Left, Center, Right (empty)
        alignItems: 'center',
        pointerEvents: 'none', // Allow clicking through empty space
        zIndex: 3000,
    };

    const btnStyle: React.CSSProperties = {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'rgba(20, 20, 20, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        pointerEvents: 'auto', // Re-enable clicks
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        color: '#fff',
        transition: 'background 0.2s ease, transform 0.2s ease',
    };

    const logoStyle: React.CSSProperties = {
        ...btnStyle,
        width: '200px', // Increased width for breathing room
        borderRadius: '100px', // Full pill shape
        padding: 0,
        background: 'rgba(20, 20, 20, 0.4)',
    };

    const contentKey = centerContent ? 'score' : 'logo';

    return (
        <div style={containerStyle}>
            <style>
                {`
                    @keyframes glitchAppear {
                        0% { opacity: 0; transform: scale(0.8); filter: blur(4px); }
                        20% { opacity: 1; transform: scale(1.05) skewX(-15deg); filter: brightness(2) contrast(2); }
                        40% { transform: scale(0.95) skewX(10deg); filter: brightness(1.2); }
                        60% { transform: scale(1.02) skewX(-5deg); filter: none; }
                        80% { transform: scale(0.99) skewX(2deg); }
                        100% { transform: scale(1) skewX(0); opacity: 1; }
                    }
                `}
            </style>
            {/* Left: Back Button (Conditional) */}
            <div style={{ justifySelf: 'start', pointerEvents: 'auto' }}>
                {showBack && (
                    <button
                        style={btnStyle}
                        onClick={onBack}
                        className="floating-back"
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Center: App Logo - clickable to trigger install prompt */}
            <div
                style={{
                    ...logoStyle,
                    justifySelf: 'center',
                    pointerEvents: 'auto',
                    cursor: onLogoClick ? 'pointer' : 'default',
                }}
                className="floating-logo"
                onClick={onLogoClick}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <div
                    key={contentKey}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'glitchAppear 0.35s cubic-bezier(0.1, 0.9, 0.2, 1)',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {centerContent || (
                        <>
                            <span style={{ fontFamily: '"BBH Bartle", sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '1px', color: '#fff' }}>BOX</span>
                            <span style={{ fontFamily: '"BBH Bartle", sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '1px', color: 'var(--accent-primary)' }}>.CRIC</span>
                        </>
                    )}
                </div>
            </div>

            {/* Right: Empty spacer */}
            <div style={{ width: 44 }}></div>
        </div>
    );
};
export default FloatingHeader;
