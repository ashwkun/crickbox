import React from 'react';

interface FloatingHeaderProps {
    showBack: boolean;
    onBack: () => void;
    onLogoClick?: () => void;
    stickyContent?: React.ReactNode; // New prop for sticky content
}

const FloatingHeader: React.FC<FloatingHeaderProps> = ({ showBack, onBack, onLogoClick, stickyContent }) => {
    // Styles for the floating container
    const isSticky = !!stickyContent;

    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        padding: isSticky ? '12px 16px' : '20px', // Smaller padding when sticky
        display: 'grid',
        gridTemplateColumns: 'auto 1fr', // Back Btn | Content
        alignItems: 'center',
        pointerEvents: isSticky ? 'auto' : 'none', // Block clicks when full bar
        zIndex: 4000,
        // Transition props
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: isSticky ? 'rgba(11, 11, 13, 0.95)' : 'transparent', // Darker background
        backdropFilter: isSticky ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: isSticky ? 'blur(20px)' : 'none',
        borderBottom: isSticky ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
        maxHeight: isSticky ? '64px' : 'auto', // Constraint height (64px is standard header)
        gap: 12
    };

    const btnStyle: React.CSSProperties = {
        width: isSticky ? '32px' : '40px', // Smaller in sticky mode
        height: isSticky ? '32px' : '40px',
        borderRadius: '50%',
        background: isSticky ? 'rgba(255,255,255,0.08)' : 'rgba(20, 20, 20, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        pointerEvents: 'auto',
        boxShadow: isSticky ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.2)',
        color: '#fff',
        transition: 'all 0.2s ease',
        flexShrink: 0
    };

    const logoStyle: React.CSSProperties = {
        ...btnStyle,
        width: 'auto',
        padding: '0 16px',
        borderRadius: '24px',
        userSelect: 'none',
        opacity: isSticky ? 0 : 1, // Hide logo when sticky
        pointerEvents: isSticky ? 'none' : 'auto',
        visibility: isSticky ? 'hidden' : 'visible', // Ensure it doesn't take space/clicks
        position: isSticky ? 'absolute' : 'relative', // Remove from flow
    };

    return (
        <div style={containerStyle}>
            {/* Left: Back Button */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {showBack && (
                    <button
                        style={btnStyle}
                        onClick={onBack}
                        className="floating-back"
                    >
                        <svg width={isSticky ? "18" : "24"} height={isSticky ? "18" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Sticky Content Area */}
            {isSticky ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    // justifyContent: 'center', // REMOVED to allow child to control layout
                    animation: 'fadeIn 0.3s ease',
                    minWidth: 0, // Allow text truncation
                    height: '100%'
                }}>
                    {stickyContent}
                </div>
            ) : (
                /* Original Logo Area (Centered via Grid/Flex fallback) */
                <div style={{
                    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                    pointerEvents: 'auto'
                }}>
                    <div
                        style={{ ...logoStyle, cursor: onLogoClick ? 'pointer' : 'default' }}
                        className="floating-logo"
                        onClick={onLogoClick}
                    >
                        <span style={{ fontFamily: '"BBH Bartle", sans-serif', fontSize: '16px', fontWeight: 400, letterSpacing: '1px', color: '#fff' }}>BOX</span>
                        <span style={{ fontFamily: '"BBH Bartle", sans-serif', fontSize: '16px', fontWeight: 400, letterSpacing: '1px', color: 'var(--accent-primary)' }}>.CRIC</span>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default FloatingHeader;
