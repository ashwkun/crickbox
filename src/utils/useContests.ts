import { useState, useCallback, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { User } from 'firebase/auth';

export interface Contest {
    id: string;
    match_id: string;
    name: string;
    code: string;
    created_by: string;
    max_entries: number;
    created_at: string;
    entry_count?: number;  // derived
}

export interface ContestEntry {
    id: string;
    contest_id: string;
    user_id: string;
    display_name: string;
    photo_url?: string | null;
    joined_at: string;
}

// Generate a random 6-char invite code
function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

export function useContests(user: User | null) {
    const [myContests, setMyContests] = useState<Record<string, Contest[]>>({}); // keyed by match_id
    const [loading, setLoading] = useState(true);

    // Fetch all contests the user has joined, grouped by match_id
    const fetchMyContests = useCallback(async () => {
        if (!user) { setMyContests({}); setLoading(false); return; }

        try {
            setLoading(true);

            // Get all contest_entries for this user
            const { data: entries, error: entErr } = await supabase
                .from('contest_entries')
                .select('contest_id')
                .eq('user_id', user.uid);

            if (entErr) throw entErr;
            if (!entries?.length) { setMyContests({}); setLoading(false); return; }

            const contestIds = entries.map(e => e.contest_id);

            // Get the actual contests
            const { data: contests, error: cErr } = await supabase
                .from('contests')
                .select('*')
                .in('id', contestIds);

            if (cErr) throw cErr;

            // Get entry counts for these contests
            const { data: allEntries, error: aeErr } = await supabase
                .from('contest_entries')
                .select('contest_id')
                .in('contest_id', contestIds);

            // Count entries per contest
            const countMap: Record<string, number> = {};
            allEntries?.forEach(e => { countMap[e.contest_id] = (countMap[e.contest_id] || 0) + 1; });

            // Group by match_id
            const grouped: Record<string, Contest[]> = {};
            contests?.forEach(c => {
                const contest: Contest = { ...c, entry_count: countMap[c.id] || 0 };
                if (!grouped[c.match_id]) grouped[c.match_id] = [];
                grouped[c.match_id].push(contest);
            });

            setMyContests(grouped);
        } catch (err: any) {
            console.error('Error fetching contests:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchMyContests(); }, [fetchMyContests]);

    // Create a new contest
    const createContest = async (matchId: string, name: string, maxEntries: number = 20): Promise<Contest> => {
        if (!user) throw new Error('Not logged in');

        const code = generateCode();
        const { data, error } = await supabase
            .from('contests')
            .insert({ match_id: matchId, name, code, created_by: user.uid, max_entries: maxEntries })
            .select()
            .single();

        if (error) throw error;

        // Auto-join the creator
        await joinContest(data.id);

        await fetchMyContests();
        return data as Contest;
    };

    // Join a contest by ID (internal)
    const joinContest = async (contestId: string) => {
        if (!user) throw new Error('Not logged in');

        const displayName = user.displayName || user.email?.split('@')[0] || 'Player';
        const photoUrl = user.photoURL || null;

        const { error } = await supabase
            .from('contest_entries')
            .insert({ contest_id: contestId, user_id: user.uid, display_name: displayName, photo_url: photoUrl });

        if (error) {
            if (error.code === '23505') throw new Error('Already joined this contest');
            throw error;
        }
    };

    // Join by invite code
    const joinByCode = async (code: string): Promise<Contest> => {
        if (!user) throw new Error('Not logged in');

        // Find the contest
        const { data: contest, error: cErr } = await supabase
            .from('contests')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .single();

        if (cErr || !contest) throw new Error('Contest not found. Check the code and try again.');

        // Check entry count
        const { count } = await supabase
            .from('contest_entries')
            .select('*', { count: 'exact', head: true })
            .eq('contest_id', contest.id);

        if (count !== null && count >= contest.max_entries) throw new Error('Contest is full');

        await joinContest(contest.id);
        await fetchMyContests();
        return contest as Contest;
    };

    // Get leaderboard for a contest (user IDs + display names)
    const getLeaderboard = async (contestId: string): Promise<ContestEntry[]> => {
        const { data, error } = await supabase
            .from('contest_entries')
            .select('*')
            .eq('contest_id', contestId)
            .order('joined_at', { ascending: true });

        if (error) throw error;
        return (data || []) as ContestEntry[];
    };

    // Get contests for a specific match (not just user's — for discovery)
    const getContestsForMatch = async (matchId: string): Promise<Contest[]> => {
        const { data, error } = await supabase
            .from('contests')
            .select('*')
            .eq('match_id', matchId);

        if (error) throw error;
        return (data || []) as Contest[];
    };

    return {
        myContests,
        loading,
        createContest,
        joinByCode,
        getLeaderboard,
        getContestsForMatch,
        refreshContests: fetchMyContests,
    };
}
