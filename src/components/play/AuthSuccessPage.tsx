import React from 'react';
import { LuCheck } from 'react-icons/lu';

/**
 * AuthSuccessPage - Shown after successful magic link sign-in
 * 
 * Clean full-screen overlay with branded messaging
 */
const AuthSuccessPage: React.FC = () => {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            zIndex: 9999,
        }}>
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
                @keyframes shimmer {
                    0% { background-position: 100% 0; }
                    100% { background-position: 0% 0; }
                }
            `}</style>

            {/* Success checkmark */}
            <div style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
                border: '2px solid rgba(34, 197, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 40,
                animation: 'pulse 2s ease-in-out infinite',
            }}>
                <LuCheck size={60} color="#22c55e" />
            </div>

            {/* Title */}
            <h1 style={{
                fontFamily: '"BBH Bartle", sans-serif',
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: '1px',
                margin: 0,
                marginBottom: 16,
                color: '#fff',
            }}>
                You're in!
            </h1>

            {/* Branded message */}
            <p style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
            }}>
                Ready to
                <span style={{
                    fontFamily: '"BBH Bartle", sans-serif',
                    fontSize: 18,
                    fontWeight: 600,
                    letterSpacing: '1px',
                    background: 'linear-gradient(90deg, #ec4899, #f9a8d4, #ec4899)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'shimmer 2s ease-in-out infinite',
                }}>.PLAY</span>
            </p>

            {/* Subtle instruction */}
            <p style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.3)',
                margin: 0,
                marginTop: 60,
            }}>
                Return to the app to continue
            </p>
        </div>
    );
};

export default AuthSuccessPage;
