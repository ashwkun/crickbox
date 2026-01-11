import React from 'react';
import { LuGamepad2, LuSparkles } from 'react-icons/lu';

const PlayPage: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div style={{
            padding: '24px 20px 120px', // Extra bottom padding for floating dock
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
        }}>
            {/* Ambient Background Glow */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%)',
                filter: 'blur(40px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            {/* Content Glass Card */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                background: 'rgba(20, 20, 20, 0.6)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 24,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '40px 32px',
                textAlign: 'center',
                maxWidth: '340px',
                width: '100%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20
            }}>
                {/* Icon Wrapper */}
                <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.8), rgba(10, 10, 10, 0.9))',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    marginBottom: 8
                }}>
                    <LuGamepad2 size={36} color="#6366f1" />
                </div>

                {/* Text */}
                <div>
                    <h2 style={{
                        margin: 0,
                        fontSize: '28px',
                        fontWeight: 700,
                        color: '#fff',
                        letterSpacing: '-0.5px',
                        marginBottom: 8
                    }}>
                        Fantasy League
                    </h2>
                    <p style={{
                        margin: 0,
                        fontSize: '15px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        lineHeight: 1.5
                    }}>
                        Build your team. Compete with friends.
                        Topping the leaderboard soon.
                    </p>
                </div>

                {/* Tag */}
                <div style={{
                    padding: '6px 16px',
                    borderRadius: 100,
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                }}>
                    <LuSparkles size={14} color="#a5b4fc" />
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#a5b4fc',
                        letterSpacing: '0.5px'
                    }}>
                        COMING SOON
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PlayPage;
