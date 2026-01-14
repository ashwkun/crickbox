import React, { useEffect } from 'react';
import { User } from 'firebase/auth';
import { useFirebaseAuth } from '../../utils/useFirebaseAuth';
import AuthSuccessPage from './AuthSuccessPage';
import LoginPage from './LoginPage';
import GameDashboard from './GameDashboard';
import SkeletonLoginPage from './SkeletonLoginPage';
import WelcomeOverlay from './WelcomeOverlay';

interface PlayPageProps {
    isVisible?: boolean;
    onSuccessPage?: (isSuccess: boolean) => void;
}

// Session storage key to track if welcome has been shown this session
const WELCOME_SHOWN_KEY = 'boxcric_welcome_shown_session';

const PlayPage: React.FC<PlayPageProps> = ({ isVisible = true, onSuccessPage }) => {
    const {
        user,
        loading,
        showSuccessPage,
        signInWithGoogle,
        signInWithMagicLink,
        signOut
    } = useFirebaseAuth();

    const [showWelcome, setShowWelcome] = React.useState(false);
    const [welcomeComplete, setWelcomeComplete] = React.useState(false);
    const [isVisibilityChecked, setIsVisibilityChecked] = React.useState(false);

    // Notify parent when success page is shown
    useEffect(() => {
        onSuccessPage?.(showSuccessPage);
    }, [showSuccessPage, onSuccessPage]);

    // Handle Welcome Overlay Logic with Visibility Check
    useEffect(() => {
        if (user && !loading) {
            const hasShownWelcome = sessionStorage.getItem(WELCOME_SHOWN_KEY);

            const triggerWelcome = () => {
                if (!hasShownWelcome) {
                    setShowWelcome(true);
                    sessionStorage.setItem(WELCOME_SHOWN_KEY, 'true');
                } else {
                    setWelcomeComplete(true);
                }
                setIsVisibilityChecked(true);
            };

            if (document.visibilityState === 'visible') {
                triggerWelcome();
            } else {
                // Wait for tab to become visible
                const onVisibilityChange = () => {
                    if (document.visibilityState === 'visible') {
                        triggerWelcome();
                        document.removeEventListener('visibilitychange', onVisibilityChange);
                    }
                };
                document.addEventListener('visibilitychange', onVisibilityChange);
                return () => document.removeEventListener('visibilitychange', onVisibilityChange);
            }
        }
    }, [user, loading]);

    if (!isVisible) return null;

    // Loading state or waiting for visibility check
    if (loading || (user && !isVisibilityChecked)) {
        return <SkeletonLoginPage />;
    }

    // Success page after magic link (full-screen overlay)
    if (showSuccessPage) {
        return <AuthSuccessPage />;
    }

    // Authenticated State
    if (user) {
        return (
            <>
                <WelcomeOverlay
                    name={user.displayName?.split(' ')[0] || 'Player'}
                    show={showWelcome}
                    onComplete={() => {
                        setShowWelcome(false);
                        setWelcomeComplete(true);
                    }}
                />

                {/* 
                  Only show dashboard when welcome is dismissed (or if it was skipped).
                  This prevents the dashboard from flashing behind the overlay if we want a clean transition,
                  OR we can render it behind to have it ready. 
                  Let's render it behind so it's ready when fluid overlay fades out.
                */}
                <GameDashboard user={user} onSignOut={() => {
                    sessionStorage.removeItem(WELCOME_SHOWN_KEY); // Reset for next login
                    signOut();
                }} />
            </>
        );
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
