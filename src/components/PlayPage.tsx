import React, { useState } from 'react';
import { LuGamepad2, LuMail, LuRefreshCw, LuCheck, LuLogIn } from 'react-icons/lu';
import { useFirebaseAuth } from '../utils/useFirebaseAuth';

interface PlayPageProps {
    isVisible?: boolean;
}

/**
 * PlayPage - Fantasy Cricket Game Section
 * 
 * Uses Firebase Auth for Google Sign-In and Magic Link
 * Theme: Hot Pink (#ec4899)
 */
const PlayPage: React.FC<PlayPageProps> = ({ isVisible = true }) => {
    const {
        user,
        loading,
        showSuccessPage,
        signInWithGoogle,
        signInWithMagicLink,
        signOut
    } = useFirebaseAuth();
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailError, setEmailError] = useState('');

    if (!isVisible) return null;

    const handleMagicLink = async () => {
        if (!email || !email.includes('@')) {
            setEmailError('Please enter a valid email');
            return;
        }
        setEmailLoading(true);
        setEmailError('');
        const { error } = await signInWithMagicLink(email);
        setEmailLoading(false);
        if (error) {
            setEmailError('Failed to send link. Try again.');
        } else {
            setEmailSent(true);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div style={{
                minHeight: 'calc(100vh - 85px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <LuRefreshCw size={32} color="#ec4899" style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Static success page after magic link (no interactions)
    if (showSuccessPage) {
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
                {/* Success Icon */}
                <div style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))',
                    border: '2px solid rgba(34, 197, 94, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 32,
                    boxShadow: '0 0 60px rgba(34, 197, 94, 0.3)',
                }}>
                    <LuCheck size={50} color="#22c55e" />
                </div>

                {/* Title */}
                <h1 style={{
                    fontSize: 28,
                    fontWeight: 800,
                    letterSpacing: '-0.5px',
                    margin: 0,
                    marginBottom: 12,
                    color: '#22c55e',
                }}>
                    Sign In Successful!
                </h1>

                {/* Subtitle */}
                <p style={{
                    fontSize: 18,
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: 0,
                    marginBottom: 40,
                    lineHeight: 1.5,
                }}>
                    You're ready to <span style={{
                        color: '#ec4899',
                        fontWeight: 800,
                    }}>.PLAY</span>
                </p>

                {/* Visual hint */}
                <div style={{
                    padding: '16px 24px',
                    borderRadius: 16,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                    <p style={{
                        fontSize: 14,
                        color: 'rgba(255, 255, 255, 0.5)',
                        margin: 0,
                    }}>
                        Open <span style={{
                            color: '#ec4899',
                            fontWeight: 700,
                            fontFamily: 'BBH Bartle, sans-serif',
                        }}>box.cric</span> from your home screen
                    </p>
                </div>
            </div>
        );
    }

    // Authenticated - Show game content (Coming Soon for now)
    if (user) {
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

                {/* User Avatar */}
                {user.photoURL && (
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
                )}

                {/* Glowing Icon */}
                {!user.photoURL && (
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
                    onClick={signOut}
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
    }

    // Not authenticated - Show login UI
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
            {/* Icon */}
            <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.05))',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
            }}>
                <LuGamepad2 size={36} color="#ec4899" />
            </div>

            {/* Title */}
            <h1 style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: '-0.5px',
                margin: 0,
                marginBottom: 8,
                color: '#fff',
            }}>
                Join the Game
            </h1>

            {/* Subtitle */}
            <p style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
                marginBottom: 32,
                maxWidth: 260,
                lineHeight: 1.5,
            }}>
                Sign in to create your dream XI and compete with friends
            </p>

            {/* Google Sign In */}
            <button
                onClick={signInWithGoogle}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    width: '100%',
                    maxWidth: 300,
                    padding: '14px 24px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#fff',
                    color: '#1f2937',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: 16,
                    transition: 'transform 0.2s ease',
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
            </button>

            {/* Divider */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: 300,
                margin: '8px 0 24px',
            }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ padding: '0 16px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* Magic Link */}
            {!emailSent ? (
                <div style={{ width: '100%', maxWidth: 300 }}>
                    <div style={{
                        display: 'flex',
                        gap: 8,
                        marginBottom: emailError ? 8 : 0,
                    }}>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
                            style={{
                                flex: 1,
                                padding: '14px 16px',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                fontSize: 15,
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={handleMagicLink}
                            disabled={emailLoading}
                            style={{
                                padding: '14px 18px',
                                borderRadius: 12,
                                border: 'none',
                                background: '#ec4899',
                                color: '#fff',
                                cursor: emailLoading ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {emailLoading ? (
                                <LuRefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <LuMail size={20} />
                            )}
                        </button>
                    </div>
                    {emailError && (
                        <p style={{ fontSize: 12, color: '#ef4444', margin: 0, textAlign: 'left' }}>{emailError}</p>
                    )}
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    padding: '20px 24px',
                    borderRadius: 12,
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    maxWidth: 300,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <LuCheck size={20} color="#22c55e" />
                        <span style={{ fontSize: 14, color: '#86efac' }}>
                            Magic link sent!
                        </span>
                    </div>
                    <p style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.5)',
                        margin: 0,
                        textAlign: 'center',
                        lineHeight: 1.5,
                    }}>
                        Check your email and click the link. Then come back to this app.
                    </p>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default PlayPage;
