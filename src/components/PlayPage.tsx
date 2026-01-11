import React from 'react';
import { LuGamepad2, LuSparkles, LuTrophy } from 'react-icons/lu';

interface PlayPageProps {
    isVisible?: boolean;
}

/**
 * PlayPage - Fantasy Cricket Game Section
 * 
 * Placeholder with "Coming Soon" premium design
 * Theme: Electric Purple (#8b5cf6)
 */
const PlayPage: React.FC<PlayPageProps> = ({ isVisible = true }) => {
    if (!isVisible) return null;

    return (
        <div style={{
            minHeight: 'calc(100vh - 85px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px 120px', // Extra bottom padding for navbar
            textAlign: 'center',
        }}>
            {/* Glowing Icon */}
            <div style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05))',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
                boxShadow: '0 0 60px rgba(139, 92, 246, 0.3)',
                animation: 'pulse 3s ease-in-out infinite',
            }}>
                <LuGamepad2 size={44} color="#8b5cf6" />
            </div>

            {/* Title */}
            <h1 style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: '-1px',
                margin: 0,
                marginBottom: 12,
                background: 'linear-gradient(135deg, #8b5cf6, #c4b5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}>
                Fantasy Cricket
            </h1>

            {/* Subtitle */}
            <p style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
                marginBottom: 40,
                maxWidth: 280,
                lineHeight: 1.5,
            }}>
                Build your dream XI. Compete with friends. Win glory.
            </p>

            {/* Feature Pills */}
            <div style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginBottom: 48,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 100,
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                }}>
                    <LuSparkles size={14} color="#8b5cf6" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>AI Insights</span>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 100,
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                }}>
                    <LuTrophy size={14} color="#8b5cf6" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>Leaderboards</span>
                </div>
            </div>

            {/* Coming Soon Badge */}
            <div style={{
                padding: '12px 28px',
                borderRadius: 100,
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.2)',
            }}>
                <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(90deg, #8b5cf6, #c4b5fd)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    Coming Soon
                </span>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};

export default PlayPage;
