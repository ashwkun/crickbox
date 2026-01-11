/**
 * useAuth - Custom hook for Supabase authentication
 * 
 * Provides:
 * - Current user state
 * - Loading state
 * - Sign in methods (Google, Magic Link)
 * - Sign out
 */

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
    });

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuthState({
                user: session?.user ?? null,
                session,
                loading: false,
            });
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setAuthState({
                    user: session?.user ?? null,
                    session,
                    loading: false,
                });
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Sign in with Google (redirect mode for PWA)
    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/#play',
            },
        });
        if (error) console.error('Google sign-in error:', error);
    };

    // Sign in with Magic Link (email)
    const signInWithMagicLink = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin + '/#play',
            },
        });
        if (error) {
            console.error('Magic link error:', error);
            return { error };
        }
        return { error: null };
    };

    // Sign out
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Sign out error:', error);
    };

    return {
        user: authState.user,
        session: authState.session,
        loading: authState.loading,
        signInWithGoogle,
        signInWithMagicLink,
        signOut,
    };
}
