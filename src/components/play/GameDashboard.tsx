import React from 'react';
import { LuGamepad2, LuLogIn } from 'react-icons/lu';
import { User } from 'firebase/auth';

interface GameDashboardProps {
    user: User;
    onSignOut: () => void;
}

/**
 * GameDashboard - Main authenticated view for Fantasy Cricket
 * 
 * Currently shows Coming Soon state
 * Will be expanded for team creation, contests, etc.
 */
const GameDashboard: React.FC<GameDashboardProps> = ({ user, onSignOut }) => {
    return (
        <div style={{
            minHeight: 'calc(100vh - 85px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px 120px',
            textAlign: 'center',
        }}>
            {/* User greeting */}
            <div style={{
                marginBottom: 32,
                padding: '12px 20px',
                borderRadius: 100,
                background: 'rgba(236, 72, 153, 0.1)',
                border: '1px solid rgba(236, 72, 153, 0.2)',
            }}>
                <span style={{ fontSize: 14, color: '#f9a8d4' }}>
                    Welcome, <strong style={{ color: '#ec4899' }}>{user.displayName || user.email?.split('@')[0] || 'Player'}</strong>
                </span>
            </div>

            {/* User Avatar or Icon */}
            {user.photoURL ? (
                <img
                    src={user.photoURL}
                    alt="Profile"
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        marginBottom: 24,
                        border: '2px solid rgba(236, 72, 153, 0.3)',
                    }}
                />
            ) : (
                <div style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.05))',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 32,
                    boxShadow: '0 0 60px rgba(236, 72, 153, 0.3)',
                }}>
                    <LuGamepad2 size={44} color="#ec4899" />
                </div>
            )}

            {/* Title */}
            <h1 style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: '-1px',
                margin: 0,
                marginBottom: 12,
                background: 'linear-gradient(135deg, #ec4899, #f9a8d4)',
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

            {/* Coming Soon Badge */}
            <div style={{
                padding: '12px 28px',
                borderRadius: 100,
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.1))',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                marginBottom: 24,
            }}>
                <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(90deg, #ec4899, #f9a8d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    Coming Soon
                </span>
            </div>

            {/* Sign Out */}
            <button
                onClick={onSignOut}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 100,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}
            >
                <LuLogIn size={16} />
                Sign Out
            </button>
        </div>
    );
};

export default GameDashboard;
