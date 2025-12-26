import React from 'react';

interface FloatingHeaderProps {
    showBack: boolean;
    onBack: () => void;
}

const FloatingHeader: React.FC<FloatingHeaderProps> = ({ showBack, onBack }) => {
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
        background: 'rgba(20, 20, 20, 0.4)', // Darker glass
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        pointerEvents: 'auto', // Re-enable clicks
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        color: '#fff',
        transition: 'all 0.2s ease',
    };

    const logoStyle: React.CSSProperties = {
        ...btnStyle,
        width: 'auto',
        padding: '0 16px',
        borderRadius: '24px', // Pill shape for logo? Or circle? User said circle.
        // If logo is text "BOX.CRIC", it needs width.
        // User said "one for the app logo".
        // If I make it a circle, I can put an icon?
        // Or I can make it a specific width for the text logo.
    };
    // Re-reading: "two circular glassmorphiic continers one for the app logo"
    // Does 'logo' imply the BRAND text or just an icon?
    // Current logo has text. I'll stick to a Pill for text logo, or just use the icon if available.
    // I'll keep the text LOGO but inside a glass container.

    return (
        <div style={containerStyle}>
            {/* Left: Back Button (Conditional) */}
            <div style={{ justifySelf: 'start', pointerEvents: 'auto' }}>
                {showBack && (
                    <button
                        style={btnStyle}
                        onClick={onBack}
                        className="floating-back"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Center: App Logo */}
            <div style={{ ...logoStyle, justifySelf: 'center', pointerEvents: 'auto' }} className="floating-logo">
                <span style={{ fontFamily: '"BBH Bartle", sans-serif', fontSize: '16px', fontWeight: 400, letterSpacing: '1px', color: '#fff' }}>BOX</span>
                <span style={{ fontFamily: '"BBH Bartle", sans-serif', fontSize: '16px', fontWeight: 400, letterSpacing: '1px', color: 'var(--accent-primary)' }}>.CRIC</span>
            </div>

            {/* Right: Empty spacer */}
            <div />
        </div>
    );
};

export default FloatingHeader;
