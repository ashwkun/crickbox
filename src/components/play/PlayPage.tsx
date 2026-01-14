import React, { useEffect } from 'react';
import { User } from 'firebase/auth';
import { useFirebaseAuth } from '../../utils/useFirebaseAuth';
import { useUserProfile } from '../../utils/useUserProfile';
import AuthSuccessPage from './AuthSuccessPage';
import LoginPage from './LoginPage';
import GameDashboard from './GameDashboard';
import SkeletonLoginPage from './SkeletonLoginPage';
import WelcomeOverlay from './WelcomeOverlay';
import ProfileSetupPage from './ProfileSetupPage';

interface PlayPageProps {
    isVisible?: boolean;
    onSuccessPage?: (isSuccess: boolean) => void;
}

// Session storage key to track if welcome has been shown this session
const WELCOME_SHOWN_KEY = 'boxcric_welcome_shown_session';

const PlayPage: React.FC<PlayPageProps> = ({ isVisible = true, onSuccessPage }) => {
    const {
        user,
        loading: authLoading,
        showSuccessPage,
        signInWithGoogle,
        signInWithMagicLink,
        signOut
    } = useFirebaseAuth();

    const {
        profile,
        loading: profileLoading,
        error: profileError,
        isProfileComplete,
        saveProfile
    } = useUserProfile(user);

    const [showWelcome, setShowWelcome] = React.useState(false);
    const [welcomeComplete, setWelcomeComplete] = React.useState(false);
    const [isVisibilityChecked, setIsVisibilityChecked] = React.useState(false);

    // Combined loading state
    const loading = authLoading || (user && profileLoading);

    // DEBUG: Log loading states
    console.log('[PlayPage] authLoading:', authLoading, 'user:', !!user, 'profileLoading:', profileLoading, 'combined loading:', loading);

    // Notify parent when success page is shown
    useEffect(() => {
        onSuccessPage?.(showSuccessPage);
    }, [showSuccessPage, onSuccessPage]);

    // Handle Welcome Overlay Logic with Visibility Check
    // Trigger for users who either have complete profile OR have Firebase displayName (Google users)
    const canShowWelcome = user && !authLoading && !profileLoading && (isProfileComplete || user.displayName);

    useEffect(() => {
        if (canShowWelcome) {
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
    }, [canShowWelcome]);

    if (!isVisible) return null;

    // Loading state
    if (loading) {
        return <SkeletonLoginPage />;
    }

    // Success page after magic link (full-screen overlay)
    if (showSuccessPage) {
        return <AuthSuccessPage />;
    }

    // Authenticated but profile incomplete - show setup
    // Only required if Firebase displayName is missing (Magic Link users)
    const needsProfileSetup = user && !user.displayName && !isProfileComplete;

    if (needsProfileSetup) {
        return (
            <ProfileSetupPage
                onComplete={saveProfile}
                loading={profileLoading}
                error={profileError}
            />
        );
    }

    // Authenticated with profile - waiting for visibility check
    if (user && !isVisibilityChecked) {
        return <SkeletonLoginPage />;
    }

    // Authenticated State with complete profile (Google or Magic Link with profile)
    if (user) {
        // Get display name: Firebase > Supabase > Email prefix > fallback
        const displayName = user.displayName?.split(' ')[0]
            || profile?.display_name
            || user.email?.split('@')[0]
            || 'Player';

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

