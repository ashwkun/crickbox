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
        background: 'rgba(20, 20, 20, 0.65)',
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
        width: '180px', // Fixed width to prevent dimension changes
        borderRadius: '100px', // Full pill shape
        padding: 0,
        background: centerContent ? 'rgba(0, 0, 0, 0.85)' : 'rgba(20, 20, 20, 0.65)',
    };

    const contentKey = centerContent ? 'score' : 'logo';

    return (
        <div style={containerStyle}>
            <style>
                {`
                    @keyframes slideInBlob {
                        0% { opacity: 0; transform: translateY(20px) scale(0.9); filter: blur(8px); }
                        100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
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
                        animation: 'slideInBlob 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {centerContent || (
                        <>
                            <span style={{ fontFamily: '"BBH Bartle", sans-serif', fontSize: '18px', fontWeight: 600, letterSpacing: '0.5px', color: '#fff' }}>BOX</span>
                            <span style={{ fontFamily: '"BBH Bartle", sans-serif', fontSize: '18px', fontWeight: 600, letterSpacing: '0.5px', color: 'var(--accent-primary)' }}>.CRIC</span>
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
