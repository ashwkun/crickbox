import React, { useEffect } from 'react';
import { LuRefreshCw } from 'react-icons/lu';
import { useFirebaseAuth } from '../utils/useFirebaseAuth';
import AuthSuccessPage from './play/AuthSuccessPage';
import LoginPage from './play/LoginPage';
import GameDashboard from './play/GameDashboard';

interface PlayPageProps {
    isVisible?: boolean;
    onSuccessPage?: (isSuccess: boolean) => void;
}

/**
 * PlayPage - Fantasy Cricket Game Section
 * 
 * Orchestrates authentication flow and renders appropriate sub-component:
 * - AuthSuccessPage: After magic link sign-in
 * - LoginPage: For unauthenticated users
 * - GameDashboard: For authenticated users
 * 
 * Theme: Hot Pink (#ec4899)
 */
const PlayPage: React.FC<PlayPageProps> = ({ isVisible = true, onSuccessPage }) => {
    const {
        user,
        loading,
        showSuccessPage,
        signInWithGoogle,
        signInWithMagicLink,
        signOut
    } = useFirebaseAuth();

    // Notify parent when success page is shown
    useEffect(() => {
        onSuccessPage?.(showSuccessPage);
    }, [showSuccessPage, onSuccessPage]);

    if (!isVisible) return null;

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

    // Success page after magic link (full-screen overlay)
    if (showSuccessPage) {
        return <AuthSuccessPage />;
    }

    // Authenticated - Show game dashboard
    if (user) {
        return <GameDashboard user={user} onSignOut={signOut} />;
    }

    // Not authenticated - Show login
    return (
        <LoginPage
            onGoogleSignIn={signInWithGoogle}
            onMagicLink={signInWithMagicLink}
        />
    );
};

export default PlayPage;
