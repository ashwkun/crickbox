/**
 * useFirebaseAuth - Custom hook for Firebase authentication
 * 
 * Provides:
 * - Current user state
 * - Loading state
 * - Sign in methods (Google, Magic Link)
 * - Sign out
 * - Email link detection
 */

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthState {
    user: User | null;
    loading: boolean;
    showSuccessPage: boolean; // Show static success page after email link sign-in
}

// Check if running in standalone PWA mode
const isStandalonePWA = () => {
    return (window.matchMedia('(display-mode: standalone)').matches) ||
        ((window.navigator as any).standalone === true);
};

// Email link settings
const actionCodeSettings = {
    url: window.location.origin + '/#play',
    handleCodeInApp: true,
};

export function useFirebaseAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        loading: true,
        showSuccessPage: false,
    });

    useEffect(() => {
        let unsubscribe: () => void;

        const initAuth = async () => {
            // Check for redirect result (for mobile OAuth)
            // We await this to ensure we don't show the login page momentarily
            // if the user is actually signing in via redirect.
            try {
                await getRedirectResult(auth);
            } catch (error) {
                console.error('Redirect sign-in error:', error);
            }

            // Check if returning from email link
            if (isSignInWithEmailLink(auth, window.location.href)) {
                // ... (existing email link logic)
                const email = window.localStorage.getItem('emailForSignIn');
                if (email) {
                    signInWithEmailLink(auth, email, window.location.href)
                        .then(() => {
                            window.localStorage.removeItem('emailForSignIn');
                            setAuthState(prev => ({ ...prev, showSuccessPage: true, loading: false }));
                        })
                        .catch((error) => {
                            console.error('Email link sign-in error:', error);
                            setAuthState(prev => ({ ...prev, loading: false }));
                        });
                } else {
                    setAuthState(prev => ({ ...prev, showSuccessPage: true, loading: false }));
                }
                return;
            }

            // Listen for auth state changes
            unsubscribe = onAuthStateChanged(auth, (user) => {
                setAuthState(prev => ({
                    ...prev,
                    user,
                    loading: false,
                }));
            });
        };

        initAuth();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Sign in with Google
    const signInWithGoogle = async () => {
        try {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                await signInWithRedirect(auth, googleProvider);
            } else {
                await signInWithPopup(auth, googleProvider);
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
        }
    };

    // Sign in with Magic Link (email)
    const signInWithMagicLink = async (email: string) => {
        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
            return { error: null };
        } catch (error) {
            console.error('Magic link error:', error);
            return { error };
        }
    };

    // Sign out
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return {
        user: authState.user,
        loading: authState.loading,
        showSuccessPage: authState.showSuccessPage,
        isStandalonePWA: isStandalonePWA(),
        signInWithGoogle,
        signInWithMagicLink,
        signOut,
    };
}
