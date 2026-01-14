/**
 * useFirebaseAuth - Custom hook for Firebase authentication
 * 
 * Provides:
 * - Current user state
 * - Loading state
 * - Sign in methods (Google, Magic Link)
 * - Sign out
 * - Email link status for custom handling
 */

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthState {
    user: User | null;
    loading: boolean;
    emailLinkStatus: 'none' | 'needs_email' | 'success' | 'error';
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
        emailLinkStatus: 'none',
    });
    const [pendingEmail, setPendingEmail] = useState<string>('');

    useEffect(() => {
        // Check for redirect result (for mobile OAuth)
        getRedirectResult(auth).catch(console.error);

        // Check if returning from email link
        if (isSignInWithEmailLink(auth, window.location.href)) {
            const email = window.localStorage.getItem('emailForSignIn');
            if (email) {
                // We have the email - complete sign in
                signInWithEmailLink(auth, email, window.location.href)
                    .then(() => {
                        window.localStorage.removeItem('emailForSignIn');
                        window.history.replaceState(null, '', window.location.origin + '/#play');
                        setAuthState(prev => ({ ...prev, emailLinkStatus: 'success' }));
                    })
                    .catch((error) => {
                        console.error('Email link sign-in error:', error);
                        setAuthState(prev => ({ ...prev, emailLinkStatus: 'error' }));
                    });
            } else {
                // User opened link in different browser/context - need email
                setAuthState(prev => ({ ...prev, emailLinkStatus: 'needs_email', loading: false }));
            }
        }

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthState(prev => ({
                ...prev,
                user,
                loading: false,
            }));
        });

        return () => unsubscribe();
    }, []);

    // Complete email link sign in (when email is provided manually)
    const completeEmailSignIn = async (email: string) => {
        try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.history.replaceState(null, '', window.location.origin + '/#play');
            setAuthState(prev => ({ ...prev, emailLinkStatus: 'success' }));
            return { error: null };
        } catch (error) {
            console.error('Email link completion error:', error);
            setAuthState(prev => ({ ...prev, emailLinkStatus: 'error' }));
            return { error };
        }
    };

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
        emailLinkStatus: authState.emailLinkStatus,
        isStandalonePWA: isStandalonePWA(),
        signInWithGoogle,
        signInWithMagicLink,
        completeEmailSignIn,
        signOut,
    };
}
