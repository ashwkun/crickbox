import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ProfileSetupPageProps {
    onComplete: (displayName: string) => Promise<boolean>;
    loading?: boolean;
    error?: string | null;
}

/**
 * ProfileSetupPage - Blocking screen for new users to enter their display name
 * 
 * Shown after Magic Link sign-in if user has no profile in Supabase.
 * User cannot proceed until they submit a valid name.
 */
const ProfileSetupPage: React.FC<ProfileSetupPageProps> = ({ onComplete, loading, error }) => {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedName = name.trim();
        if (!trimmedName) {
            setLocalError('Please enter your name');
            return;
        }

        if (trimmedName.length < 2) {
            setLocalError('Name must be at least 2 characters');
            return;
        }

        setIsSubmitting(true);
        setLocalError(null);

        const success = await onComplete(trimmedName);

        if (!success) {
            setLocalError('Failed to save. Please try again.');
        }

        setIsSubmitting(false);
    };

    const displayError = localError || error;

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
            padding: 20,
        }}>
            <style>{`
                @keyframes liveShimmer {
                    0% { background-position: 100% 0; }
                    100% { background-position: 0% 0; }
                }
            `}</style>

            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 40,
                }}
            >
                <span style={{
                    fontFamily: '"BBH Bartle", sans-serif',
                    fontSize: 24,
                    fontWeight: 600,
                    letterSpacing: '1px',
                    color: '#fff'
                }}>BOX</span>
                <span style={{
                    fontFamily: '"BBH Bartle", sans-serif',
                    fontSize: 24,
                    fontWeight: 600,
                    letterSpacing: '1px',
                    background: 'linear-gradient(90deg, #ec4899 0%, #ec4899 35%, #f9a8d4 50%, #ec4899 65%, #ec4899 100%)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'liveShimmer 1.5s ease-in-out infinite alternate',
                }}>.PLAY</span>
            </motion.div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                style={{
                    fontSize: 'clamp(1.2rem, 5vw, 1.5rem)',
                    fontWeight: 600,
                    color: '#fff',
                    margin: 0,
                    marginBottom: 12,
                    textAlign: 'center',
                }}
            >
                What should we call you?
            </motion.h1>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                style={{
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.5)',
                    margin: 0,
                    marginBottom: 32,
                    textAlign: 'center',
                }}
            >
                This is how you'll appear in the game
            </motion.p>

            {/* Form */}
            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                onSubmit={handleSubmit}
                style={{
                    width: '100%',
                    maxWidth: 320,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                }}
            >
                {/* Input */}
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoFocus
                    disabled={isSubmitting || loading}
                    style={{
                        width: '100%',
                        padding: '16px 20px',
                        fontSize: 16,
                        fontWeight: 500,
                        color: '#fff',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: displayError
                            ? '1px solid rgba(239, 68, 68, 0.5)'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 12,
                        outline: 'none',
                        transition: 'border 0.2s, background 0.2s',
                        boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                        e.target.style.border = '1px solid rgba(236, 72, 153, 0.5)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onBlur={(e) => {
                        e.target.style.border = displayError
                            ? '1px solid rgba(239, 68, 68, 0.5)'
                            : '1px solid rgba(255, 255, 255, 0.1)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                />

                {/* Error */}
                {displayError && (
                    <p style={{
                        fontSize: 13,
                        color: '#ef4444',
                        margin: 0,
                        textAlign: 'center',
                    }}>
                        {displayError}
                    </p>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || loading || !name.trim()}
                    style={{
                        width: '100%',
                        padding: '16px 20px',
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#fff',
                        background: (isSubmitting || loading || !name.trim())
                            ? 'rgba(236, 72, 153, 0.3)'
                            : 'linear-gradient(135deg, #ec4899, #db2777)',
                        border: 'none',
                        borderRadius: 12,
                        cursor: (isSubmitting || loading || !name.trim()) ? 'not-allowed' : 'pointer',
                        transition: 'opacity 0.2s, transform 0.2s',
                        opacity: (isSubmitting || loading || !name.trim()) ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                        if (!isSubmitting && !loading && name.trim()) {
                            e.currentTarget.style.transform = 'scale(1.02)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    {isSubmitting || loading ? 'Saving...' : 'Continue'}
                </button>
            </motion.form>
        </div>
    );
};

export default ProfileSetupPage;
