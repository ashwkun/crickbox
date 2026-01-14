import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseClient';

export interface UserProfile {
    id: string;
    display_name: string;
    created_at: string;
}

interface UseUserProfileReturn {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    isProfileComplete: boolean;
    saveProfile: (displayName: string) => Promise<boolean>;
    refetch: () => Promise<void>;
}

/**
 * useUserProfile - Fetches and manages user profile from Supabase
 * 
 * Used to check if a user has completed their profile setup
 * and to save new profiles for Magic Link users.
 * 
 * SECURE: Passes Firebase ID Token to Supabase for RLS verification.
 */
export function useUserProfile(user: User | null): UseUserProfileReturn {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Helper to get a scoped Supabase client with the current user's token
    const getScopedClient = async () => {
        if (!user) return null;
        const token = await user.getIdToken();

        // Create a new client instance with the custom header
        return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });
    };

    const fetchProfile = useCallback(async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get secure client
            const client = await getScopedClient();
            if (!client) throw new Error('No user');

            const { data, error: fetchError } = await client
                .from('profiles')
                .select('*')
                .eq('id', user.uid)
                .maybeSingle();

            if (fetchError) {
                // PGRST116 = no rows found, which is expected for new users
                if (fetchError.code === 'PGRST116') {
                    setProfile(null);
                } else {
                    console.error('Error fetching profile:', fetchError);
                    setError(fetchError.message);
                }
            } else {
                setProfile(data as UserProfile);
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
            setError('Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch profile on user change
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Save profile to Supabase
    const saveProfile = useCallback(async (displayName: string): Promise<boolean> => {
        if (!user) return false;

        setLoading(true);
        setError(null);

        try {
            // Get secure client
            const client = await getScopedClient();
            if (!client) throw new Error('No user');

            const { data, error: upsertError } = await client
                .from('profiles')
                .upsert({
                    id: user.uid,
                    display_name: displayName.trim(),
                })
                .select()
                .single();

            if (upsertError) {
                // console.error('Error saving profile:', upsertError);
                setError(upsertError.message);
                return false;
            }

            setProfile(data as UserProfile);
            return true;
        } catch (err) {
            // console.error('Unexpected error saving profile:', err);
            setError('Failed to save profile');
            return false;
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        profile,
        loading,
        error,
        isProfileComplete: !!profile?.display_name,
        saveProfile,
        refetch: fetchProfile,
    };
}
