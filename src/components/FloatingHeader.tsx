import React from 'react';
import { User } from 'firebase/auth';
import { LuUser, LuSwords } from 'react-icons/lu';

export interface HeaderDisplayData {
    mainText: string;
    teamColor?: string;
    ball?: {
        id: string; // Trigger for animation
        text: string;
        color: string;
    };
}

export interface PlayContextData {
    team1Short: string;
    team2Short: string;
    team1Id?: string;
    team2Id?: string;
    team1Name?: string;
    team2Name?: string;
    team1Color?: string;
    team2Color?: string;
}

interface FloatingHeaderProps {
    showBack: boolean;
    onBack: () => void;
    onLogoClick?: () => void;
    data?: HeaderDisplayData | null;
    playContext?: PlayContextData;
    isLive?: boolean;
    isUpcoming?: boolean;
    isPast?: boolean;
    isPlay?: boolean;
    isDr11?: boolean;
    user?: User | null;
}

const FloatingHeader: React.FC<FloatingHeaderProps> = ({ showBack, onBack, onLogoClick, data, playContext, isLive, isUpcoming, isPast, isPlay, isDr11, user }) => {
    const [celebrating, setCelebrating] = React.useState(false);
    const prevBallId = React.useRef<string | undefined>(undefined);

    // Detect Ball Change
    React.useEffect(() => {
        if (data?.ball?.id) {
            // First load - do not animate
            if (prevBallId.current === undefined) {
                prevBallId.current = data.ball.id;
                return;
            }

            // Real change
            if (prevBallId.current !== data.ball.id) {
                setCelebrating(true);
                prevBallId.current = data.ball.id;

                // Reset after 1.5s
                const timer = setTimeout(() => setCelebrating(false), 1500);
                return () => clearTimeout(timer);
            }
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
        gridTemplateColumns: 'minmax(44px, 1fr) auto minmax(44px, 1fr)', // Balanced columns
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

    // Dynamic Background Logic: Corner Spotlight
    const activeBg = celebrating && data?.ball?.color
        ? data.ball.color
        : data?.teamColor
            ? `radial-gradient(circle at top left, ${data.teamColor}, rgba(20, 20, 20, 0.4) 70%)`
            : 'rgba(20, 20, 20, 0.4)';

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

    const contentKey = playContext ? 'play' : data ? 'score' : 'logo';

    // Override the pill background for play context
    const centerBg = playContext
        ? `linear-gradient(135deg, ${playContext.team1Color || '#333'}cc, rgba(20,20,20,0.8), ${playContext.team2Color || '#333'}cc)`
        : activeBg;

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
                    background: centerBg,
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
                    {playContext ? (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            animation: 'blurFocus 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}>
                            <span style={{
                                fontSize: 13, fontWeight: 800, color: '#fff',
                                textTransform: 'uppercase', letterSpacing: '1px',
                            }}>{playContext.team1Short}</span>
                            <LuSwords size={14} color="rgba(255,255,255,0.3)" />
                            <span style={{
                                fontSize: 13, fontWeight: 800, color: '#fff',
                                textTransform: 'uppercase', letterSpacing: '1px',
                            }}>{playContext.team2Short}</span>
                        </div>
                    ) : data ? (
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
                            <div
                                key={isLive ? 'live' : isUpcoming ? 'upcoming' : isPast ? 'past' : 'default'}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    animation: 'blurFocus 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                                }}
                            >
                                <span style={{ fontFamily: '"BBH Bartle", sans-serif', fontSize: '16px', fontWeight: 600, letterSpacing: '1px', color: '#fff' }}>BOX</span>
                                {isLive ? (
                                    <span key="live" style={{
                                        fontFamily: '"BBH Bartle", sans-serif',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        letterSpacing: '1px',
                                        background: 'linear-gradient(90deg, #c53030 0%, #c53030 35%, #e87070 50%, #c53030 65%, #c53030 100%)',
                                        backgroundSize: '200% 100%',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        animation: 'liveShimmer 1.5s ease-in-out infinite alternate'
                                    }}>.LIVE</span>
                                ) : isUpcoming ? (
                                    <span key="next" style={{
                                        fontFamily: '"BBH Bartle", sans-serif',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        letterSpacing: '1px',
                                        background: 'linear-gradient(90deg, #6366f1 0%, #6366f1 35%, #a5b4fc 50%, #6366f1 65%, #6366f1 100%)',
                                        backgroundSize: '200% 100%',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        animation: 'liveShimmer 1.5s ease-in-out infinite alternate'
                                    }}>.NEXT</span>
                                ) : isPast ? (
                                    <span key="past" style={{
                                        fontFamily: '"BBH Bartle", sans-serif',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        letterSpacing: '1px',
                                        background: 'linear-gradient(90deg, #d97706 0%, #d97706 35%, #fbbf24 50%, #d97706 65%, #d97706 100%)',
                                        backgroundSize: '200% 100%',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        animation: 'liveShimmer 1.5s ease-in-out infinite alternate'
                                    }}>.PAST</span>
                                ) : isPlay ? (
                                    <span key="play" style={{
                                        fontFamily: '"BBH Bartle", sans-serif',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        letterSpacing: '1px',
                                        background: 'linear-gradient(90deg, #ec4899 0%, #ec4899 35%, #f9a8d4 50%, #ec4899 65%, #ec4899 100%)',
                                        backgroundSize: '200% 100%',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        animation: 'liveShimmer 1.5s ease-in-out infinite alternate'
                                    }}>.PLAY</span>
                                ) : isDr11 ? (
                                    <span key="d11" style={{
                                        fontFamily: '"BBH Bartle", sans-serif',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        letterSpacing: '1px',
                                        background: 'linear-gradient(90deg, #10b981 0%, #10b981 35%, #6ee7b7 50%, #10b981 65%, #10b981 100%)',
                                        backgroundSize: '200% 100%',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        animation: 'liveShimmer 1.5s ease-in-out infinite alternate'
                                    }}>.D11</span>
                                ) : (
                                    <span key="cric" style={{
                                        fontFamily: '"BBH Bartle", sans-serif',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        letterSpacing: '1px',
                                        background: 'linear-gradient(90deg, #22c55e 0%, #22c55e 35%, #86efac 50%, #22c55e 65%, #22c55e 100%)',
                                        backgroundSize: '200% 100%',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        animation: 'liveShimmer 1.5s ease-in-out infinite alternate'
                                    }}>.CRIC</span>
                                )}
                            </div>
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

            {/* Right: User Profile (only on PlayPage) */}
            <div style={{ justifySelf: 'end', pointerEvents: 'auto' }}>
                {isPlay && user ? (
                    <div
                        style={{
                            ...btnStyle,
                            padding: 0,
                            overflow: 'hidden',
                            border: '1px solid rgba(236, 72, 153, 0.4)',
                        }}
                    >
                        {user.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <LuUser color="#ec4899" size={20} />
                        )}
                    </div>
                ) : (
                    <div style={{ width: 44 }} />
                )}
            </div>
        </div>
    );
};
export default FloatingHeader;
