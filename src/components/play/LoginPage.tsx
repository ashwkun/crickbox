import React from 'react';

interface LoginPageProps {
    onGoogleSignIn: () => void;
}

/**
 * LoginPage - Sign in UI for unauthenticated users
 * 
 * Redesigned with Glassmorphic Card Style
 * Theme: Hot Pink (#ec4899)
 */
const LoginPage: React.FC<LoginPageProps> = ({ onGoogleSignIn }) => {
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
                    color: '#fff',
                    letterSpacing: '-0.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                }}>
                    Lets
                    <span style={{
                        fontFamily: '"BBH Bartle", sans-serif',
                        fontSize: 36,
                        fontWeight: 600,
                        letterSpacing: '1px',
                        background: 'linear-gradient(90deg, #ec4899 0%, #ec4899 35%, #f9a8d4 50%, #ec4899 65%, #ec4899 100%)',
                        backgroundSize: '200% 100%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'shimmer 3s ease-in-out infinite alternate',
                    }}>.PLAY</span>
                </h1>

                <style>{`
                    @keyframes shimmer {
                        0% { background-position: 100% 0; }
                        100% { background-position: 0% 0; }
                    }
                `}</style>

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
                        marginBottom: 10,
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
            </div>
        </div>
    );
};

export default LoginPage;
