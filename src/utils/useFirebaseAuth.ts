/**
 * useFirebaseAuth - Custom hook for Firebase authentication
 * 
 * Provides:
 * - Current user state
 * - Loading state
 * - Sign in methods (Google, Magic Link)
 * - Sign out
 */

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthState {
    user: User | null;
    loading: boolean;
}

// Email link settings
const actionCodeSettings = {
    url: window.location.origin + '/#play',
    handleCodeInApp: true,
};

export function useFirebaseAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        loading: true,
    });

    useEffect(() => {
        // Check for redirect result (for mobile OAuth)
        getRedirectResult(auth).catch(console.error);

        // Check if returning from email link
        if (isSignInWithEmailLink(auth, window.location.href)) {
            const email = window.localStorage.getItem('emailForSignIn');
            if (email) {
                signInWithEmailLink(auth, email, window.location.href)
                    .then(() => {
                        window.localStorage.removeItem('emailForSignIn');
                        // Clean up URL
                        window.history.replaceState(null, '', window.location.origin + '/#play');
                    })
                    .catch(console.error);
            }
        }

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthState({
                user,
                loading: false,
            });
        });

        return () => unsubscribe();
    }, []);

    // Sign in with Google
    const signInWithGoogle = async () => {
        try {
            // Use redirect on mobile for better PWA experience
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
            // Save email for when user returns
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
        signInWithGoogle,
        signInWithMagicLink,
        signOut,
    };
}
