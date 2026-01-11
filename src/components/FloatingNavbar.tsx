import React from 'react';

export type NavTab = 'CRIC' | 'PLAY';

interface FloatingNavbarProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
    visible: boolean;
}

const FloatingNavbar: React.FC<FloatingNavbarProps> = ({ activeTab, onTabChange, visible }) => {
    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2900, // Below FloatingHeader (3000) but above content
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'auto',
            pointerEvents: 'none', // Allow clicks through container margin
            animation: 'floatUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            <style>{`
                @keyframes floatUp {
                    from { transform: translate(-50%, 20px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>

            {/* Glass Pill Container */}
            <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 100,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '5px',
                display: 'flex',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                pointerEvents: 'auto', // Re-enable clicks
                position: 'relative',
                overflow: 'hidden'
            }}>
                <NavButton
                    label=".CRIC"
                    isActive={activeTab === 'CRIC'}
                    onClick={() => onTabChange('CRIC')}
                    activeColor="#4ade80"
                    glowColor="rgba(74, 222, 128, 0.5)"
                />

                <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

                <NavButton
                    label=".PLAY"
                    isActive={activeTab === 'PLAY'}
                    onClick={() => onTabChange('PLAY')}
                    activeColor="#818cf8"
                    glowColor="rgba(129, 140, 248, 0.5)"
                />
            </div>
        </div>
    );
};

interface NavButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    activeColor: string;
    glowColor: string;
}

const NavButton: React.FC<NavButtonProps> = ({ label, isActive, onClick, activeColor, glowColor }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                border: 'none',
                borderRadius: 24,
                padding: '10px 24px',
                cursor: 'pointer',
                color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: '"Inter", sans-serif',
                letterSpacing: '0.5px',
                transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                position: 'relative',
                outline: 'none',
                textShadow: isActive ? `0 0 12px ${glowColor}` : 'none',
                transform: isActive || isHovered ? 'scale(1.02)' : 'scale(1)'
            }}
        >
            {label}
            {/* Active Indicator Dot */}
            {isActive && (
                <div style={{
                    position: 'absolute',
                    bottom: 6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: activeColor,
                    boxShadow: `0 0 6px ${activeColor}`
                }} />
            )}
        </button>
    );
};

export default FloatingNavbar;
