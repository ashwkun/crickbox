import React from 'react';

export interface HeaderDisplayData {
    mainText: string;
    teamColor?: string;
    ball?: {
        id: string; // Trigger for animation
        text: string;
        color: string;
    };
}

interface FloatingHeaderProps {
    showBack: boolean;
    onBack: () => void;
    onLogoClick?: () => void;
    data?: HeaderDisplayData | null;
    isLive?: boolean;
}

const FloatingHeader: React.FC<FloatingHeaderProps> = ({ showBack, onBack, onLogoClick, data, isLive }) => {
    console.log('[FloatingHeader] Render:', { isLive, hasData: !!data, data });

    const [celebrating, setCelebrating] = React.useState(false);
    const prevBallId = React.useRef<string | undefined>(undefined);

    // Detect Ball Change
    React.useEffect(() => {
        if (data?.ball?.id && prevBallId.current !== data.ball.id) {
            // New ball! Trigger celebration
            setCelebrating(true);
            prevBallId.current = data.ball.id;

            // Reset after 1.5s
            const timer = setTimeout(() => setCelebrating(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [data?.ball?.id]);

    // Cleanup on unmount or data clear
    React.useEffect(() => {
        if (!data) setCelebrating(false);
    }, [data]);

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

    // Dynamic Background Logic
    // If celebrating, use Ball Color. Else use Team Color. Else Default.
    // We mix with some transparency for glass effect.
    // Since ball colors are usually solid (e.g. #ff0000), we wrap in 'rgba(..., 0.8)' or use specific logic?
    // User wants "header bg... change to colour of the ball".
    // I'll assume data.ball.color is a valid color string.
    const activeBg = celebrating && data?.ball?.color
        ? data.ball.color // Ball color (usually bold)
        : (data?.teamColor || 'rgba(20, 20, 20, 0.4)');

    // If celebrating, we might want higher opacity to make text readable against bright colors?
    // Glassmorphism usually likes lower opacity.
    // I will apply an opacity override if it's a ball color? No, let's trust the color passed.

    const logoStyle: React.CSSProperties = {
        ...btnStyle,
        width: '200px', // Fixed width
        borderRadius: '100px',
        padding: 0,
        background: activeBg,
        transition: 'background 0.5s ease', // Faster transition for ball event
        overflow: 'hidden', // Contain the sliding elements
        boxShadow: celebrating ? `0 0 20px ${activeBg}80` : btnStyle.boxShadow, // Glow on celebration
    };

    const contentKey = data ? 'score' : 'logo';

    return (
        <div style={containerStyle}>
            <style>
                {`
                    @keyframes blurFocus {
                        0% { opacity: 0; filter: blur(12px); transform: translateY(8px) scale(1.1); }
                        100% { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); }
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

            {/* Center: App Logo or Dynamic Score */}
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
                        animation: 'blurFocus 1s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative', // Context for absolute ball
                    }}
                >
                    {data ? (
                        <>
                            {/* Score Text */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                opacity: celebrating ? 0 : 1,
                                transform: celebrating ? 'scale(0.8)' : 'scale(1)',
                                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                                    {data.mainText.split(' ')[0]} {/* Team Name */}
                                </span>
                                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                                    {data.mainText.split(' ').slice(1).join(' ')} {/* Score + Overs */}
                                </span>
                            </div>

                            {/* Separator Line (Fades out) */}
                            <div style={{
                                width: 1, height: 16, background: 'rgba(255,255,255,0.2)', margin: '0 10px',
                                opacity: celebrating ? 0 : 1, transition: 'opacity 0.2s',
                            }} />

                            {/* Last Ball Wrapper */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                position: celebrating ? 'absolute' : 'relative',
                                left: celebrating ? '50%' : 'auto',
                                transform: celebrating ? 'translateX(-50%) scale(1.8)' : 'translateX(0) scale(1)',
                                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', // Elastic pop
                            }}>
                                <span style={{
                                    fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600,
                                    opacity: celebrating ? 0 : 1, // Hide "LB" label on celebrate
                                    width: celebrating ? 0 : 'auto', overflow: 'hidden',
                                    transition: 'all 0.3s'
                                }}>LB</span>

                                {data.ball ? (
                                    <div style={{
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: celebrating ? '#fff' : data.ball.color, // Inverted on celebration? Or keep color? 
                                        // User asked for "header bg ... change to colour of the ball".
                                        // If Header BG is RED, Ball Circle should be WHITE for contrast?
                                        // Yes making it White with Colored Text is smart.
                                        color: celebrating ? data.ball.color : '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 9, fontWeight: 800,
                                        boxShadow: celebrating ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                                    }}>{data.ball.text}</div>
                                ) : <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>-</span>}
                            </div>
                        </>
                    ) : (
                        <>
                            <span style={{ fontFamily: '"BBH Bartle", sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '1px', color: '#fff' }}>BOX</span>
                            {isLive ? (
                                <span style={{
                                    fontFamily: '"BBH Bartle", sans-serif',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    letterSpacing: '1px',
                                    background: 'linear-gradient(90deg, #c53030 0%, #c53030 35%, #e87070 50%, #c53030 65%, #c53030 100%)',
                                    backgroundSize: '200% 100%',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    animation: 'liveShimmer 2s ease-in-out infinite alternate'
                                }}>.LIVE</span>
                            ) : (
                                <span style={{ fontFamily: '"BBH Bartle", sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '1px', color: 'var(--accent-primary)' }}>.CRIC</span>
                            )}
                            <style>{`
                                @keyframes liveShimmer {
                                    0% { background-position: 100% 0; }
                                    100% { background-position: 0% 0; }
                                }
                            `}</style>
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
