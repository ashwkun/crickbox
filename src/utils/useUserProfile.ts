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
                console.error('❌ [FetchProfile] Error fetching profile:', fetchError);
                setError(fetchError.message);
            } else if (!data) {
                // Profile not found (maybeSingle returned null)
                console.log('ℹ️ [FetchProfile] No profile found for user:', user.uid);

                // Start: Auto-sync for Google Users
                // If user has a Firebase displayName (e.g. Google Sign-In) but no Supabase profile, create it now.
                if (user.displayName) {
                    console.log('🔄 [Auto-Sync] Attempting to create profile for:', user.displayName);
                    try {
                        const { data: newData, error: createError } = await client
                            .from('profiles')
                            .upsert({
                                id: user.uid,
                                display_name: user.displayName,
                            })
                            .select()
                            .single();

                        if (createError) throw createError;

                        console.log('✅ [Auto-Sync] Profile created for:', user.displayName);
                        setProfile(newData as UserProfile);
                    } catch (autoCreateError) {
                        console.error('❌ [Auto-Sync] Error creating profile:', autoCreateError);
                        setProfile(null);
                    }
                } else {
                    // Magic Link user with no name yet -> triggers ProfileSetupPage
                    setProfile(null);
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
                console.error('❌ [SaveProfile] Error saving profile:', upsertError);
                setError(upsertError.message);
                return false;
            }

            console.log('✅ [SaveProfile] Profile saved successfully for:', displayName);
            setProfile(data as UserProfile);
            return true;
        } catch (err) {
            console.error('❌ [SaveProfile] Unexpected error saving profile:', err);
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
