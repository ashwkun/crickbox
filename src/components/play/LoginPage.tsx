import React, { useState } from 'react';
import { LuMail, LuRefreshCw, LuCheck, LuArrowRight } from 'react-icons/lu';

interface LoginPageProps {
    onGoogleSignIn: () => void;
    onMagicLink: (email: string) => Promise<{ error: any }>;
}

/**
 * LoginPage - Sign in UI for unauthenticated users
 * 
 * Redesigned with Glassmorphic Card Style
 * Theme: Hot Pink (#ec4899)
 */
const LoginPage: React.FC<LoginPageProps> = ({ onGoogleSignIn, onMagicLink }) => {
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailError, setEmailError] = useState('');

    const handleMagicLink = async () => {
        if (!email || !email.includes('@')) {
            setEmailError('Please enter a valid email');
            return;
        }

        // Test email bypass for UI testing
        if (email === 'test@test.com') {
            setEmailSent(true);
            return;
        }

        setEmailLoading(true);
        setEmailError('');
        const { error } = await onMagicLink(email);
        setEmailLoading(false);
        if (error) {
            setEmailError('Failed to send link. Try again.');
        } else {
            setEmailSent(true);
        }
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 85px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            width: '100%'
        }}>
            {/* Glassmorphic Card */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 24,
                padding: '40px 32px',
                width: '100%',
                maxWidth: 360,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decoration Gradient */}
                <div style={{
                    position: 'absolute',
                    top: -60,
                    right: -60,
                    width: 120,
                    height: 120,
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    filter: 'blur(20px)'
                }} />

                {/* Title Section */}
                <h1 style={{
                    fontSize: 24,
                    fontWeight: 800,
                    margin: 0,
                    marginBottom: 8,
                    background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                }}>
                    Welcome Back to
                    <span style={{
                        display: 'block',
                        fontSize: 32,
                        fontWeight: 900,
                        marginTop: 4,
                        background: 'linear-gradient(135deg, #ec4899, #f9a8d4)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>.PLAY</span>
                </h1>

                <p style={{
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.5)',
                    margin: 0,
                    marginBottom: 32,
                    lineHeight: 1.5,
                }}>
                    Sign in to manage your team & compete
                </p>

                {/* Main Actions */}
                <button
                    onClick={onGoogleSignIn}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        width: '100%',
                        padding: '16px',
                        borderRadius: 16,
                        border: 'none',
                        background: '#fff',
                        color: '#000',
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginBottom: 20,
                        transition: 'transform 0.2s ease, opacity 0.2s ease',
                        boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
                    gap: 12,
                    marginBottom: 20,
                }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>OR EMAIL</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {/* Magic Link Section */}
                {!emailSent ? (
                    <div style={{ width: '100%' }}>
                        <div style={{
                            position: 'relative',
                            marginBottom: 8,
                        }}>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    paddingRight: 50,
                                    borderRadius: 16,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.2)',
                                    color: '#fff',
                                    fontSize: 15,
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(236, 72, 153, 0.5)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                            <button
                                onClick={handleMagicLink}
                                disabled={emailLoading}
                                style={{
                                    position: 'absolute',
                                    right: 8,
                                    top: 8,
                                    bottom: 8,
                                    width: 40,
                                    borderRadius: 10,
                                    border: 'none',
                                    background: emailLoading ? 'rgba(255,255,255,0.1)' : '#ec4899',
                                    color: '#fff',
                                    cursor: emailLoading ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s',
                                }}
                            >
                                {emailLoading ? (
                                    <LuRefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                ) : (
                                    <LuArrowRight size={20} />
                                )}
                            </button>
                        </div>
                        {emailError && (
                            <p style={{ fontSize: 13, color: '#ef4444', margin: '8px 0 0', textAlign: 'left', paddingLeft: 4 }}>
                                {emailError}
                            </p>
                        )}
                    </div>
                ) : (
                    <div style={{
                        width: '100%',
                        padding: '24px',
                        background: 'rgba(236, 72, 153, 0.08)',
                        border: '1px solid rgba(236, 72, 153, 0.2)',
                        borderRadius: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: '#ec4899',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)'
                        }}>
                            <LuMail size={24} color="#fff" />
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Check Your Inbox</h3>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.4 }}>
                                We sent a secure link to<br />
                                <strong style={{ color: '#fff' }}>{email}</strong>
                            </p>
                        </div>

                        <button
                            onClick={() => setEmailSent(false)}
                            style={{
                                marginTop: 8,
                                background: 'transparent',
                                border: 'none',
                                color: '#ec4899',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Use different email
                        </button>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default LoginPage;
