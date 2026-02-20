import React, { useEffect } from 'react';
import { useFirebaseAuth } from '../../utils/useFirebaseAuth';
import LoginPage from './LoginPage';
import GameDashboard from './GameDashboard';
import SkeletonLoginPage from './SkeletonLoginPage';
import WelcomeOverlay from './WelcomeOverlay';

interface PlayPageProps {
    isVisible?: boolean;
}

const PlayPage: React.FC<PlayPageProps> = ({ isVisible = true }) => {
    const {
        user,
        loading: authLoading,
        justSignedIn,
        signInWithGoogle,
        signOut
    } = useFirebaseAuth();

    const [showWelcome, setShowWelcome] = React.useState(false);
    const [welcomeComplete, setWelcomeComplete] = React.useState(false);

    // Show welcome only on fresh sign-in
    useEffect(() => {
        if (user && !authLoading && justSignedIn) {
            if (document.visibilityState === 'visible') {
                setShowWelcome(true);
            } else {
                const onVis = () => {
                    if (document.visibilityState === 'visible') {
                        setShowWelcome(true);
                        document.removeEventListener('visibilitychange', onVis);
                    }
                };
                document.addEventListener('visibilitychange', onVis);
                return () => document.removeEventListener('visibilitychange', onVis);
            }
        } else if (user && !authLoading) {
            setWelcomeComplete(true);
        }
    }, [user, authLoading, justSignedIn]);

    if (!isVisible) return null;

    if (authLoading) return <SkeletonLoginPage />;

    if (user) {
        const displayName = user.displayName?.split(' ')[0] || 'Player';

        return (
            <>
                <WelcomeOverlay
                    name={displayName}
                    show={showWelcome}
                    onComplete={() => {
                        setShowWelcome(false);
                        setWelcomeComplete(true);
                    }}
                />
                <GameDashboard user={user} onSignOut={signOut} />
            </>
        );
    }

    // Not authenticated — Google-only login
    return <LoginPage onGoogleSignIn={signInWithGoogle} />;
};

export default PlayPage;
