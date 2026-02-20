import { useState, useCallback, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { User } from 'firebase/auth';

export interface FantasyPlayer {
    playerId: string;
    role: 'WK' | 'BAT' | 'AR' | 'BOWL';
    isCaptain: boolean;
    isViceCaptain: boolean;
}

export interface FantasyTeam {
    id?: string;
    user_id: string;
    match_id: string;
    players: FantasyPlayer[];
    total_points: number | null;
    locked: boolean;
    created_at?: string;
}

export function useFantasyTeam(user: User | null) {
    const [myTeams, setMyTeams] = useState<Record<string, FantasyTeam>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all user's teams on mount
    const fetchMyTeams = useCallback(async () => {
        if (!user) {
            setMyTeams({});
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('fantasy_teams')
                .select('*')
                .eq('user_id', user.uid);

            if (error) throw error;

            const teamsMap: Record<string, FantasyTeam> = {};
            data?.forEach(team => {
                teamsMap[team.match_id] = team as FantasyTeam;
            });
            setMyTeams(teamsMap);
        } catch (err: any) {
            console.error('Error fetching fantasy teams:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMyTeams();
    }, [fetchMyTeams]);

    // Save or update a team
    const saveTeam = async (matchId: string, players: FantasyPlayer[]) => {
        if (!user) throw new Error('Not logged in');

        try {
            const teamData: FantasyTeam = {
                user_id: user.uid,
                match_id: matchId,
                players,
                total_points: null,
                locked: false
            };

            const { data, error } = await supabase
                .from('fantasy_teams')
                .upsert({ ...teamData, updated_at: new Date().toISOString() }, { onConflict: 'user_id,match_id' })
                .select()
                .single();

            if (error) throw error;

            setMyTeams(prev => ({ ...prev, [matchId]: data as FantasyTeam }));
            return data;
        } catch (err: any) {
            console.error('Error saving fantasy team:', err);
            throw err;
        }
    };

    return {
        myTeams,
        loading,
        error,
        saveTeam,
        refreshTeams: fetchMyTeams
    };
}
