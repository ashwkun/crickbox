import { useState, useEffect, useRef, useCallback } from 'react';
import { WISDEN_MATCHES, WISDEN_SCORECARD, proxyFetch, CLIENT_SCORECARD } from './api';
import { safeSetItem } from './storage';
import { Match, Scorecard, MatchesResponse } from '../types';
import { H2HData, BatsmanSplitsResponse, OverByOverResponse, SquadData } from './h2hApi';
import { WallstreamData, BallData, extractMatchId } from './wallstreamApi';

const CACHE_KEY = 'wisden_matches_v6';
const LIVE_INTERVAL_FAST = 15000; // 15 seconds when live matches exist
const LIVE_INTERVAL_SLOW = 120000; // 2 minutes when no live matches
const FULL_REFRESH_INTERVAL = 300000; // 5 minutes for schedule/results

// Extend Window interface for preload data
declare global {
    interface Window {
        __preloadData?: {
            live: Promise<MatchesResponse>;
            upcoming: Promise<MatchesResponse>;
            results: Promise<MatchesResponse>;
        };
    }
}

// Helper to format date
const formatDate = (date: Date): string => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}${m}${y}`;
};

// Team Name Sanitization Helper
const sanitizeTeamName = (name: string): string => {
    if (!name) return name;
    return name
        .replace(/Royal Challengers Bangalore/gi, 'Royal Challengers')
        .replace(/Royal Challengers Bengaluru/gi, 'Royal Challengers')
        .replace(/\bWomen\b/g, 'W'); // e.g., "India Women" → "India W"
};

const sanitizeMatch = (m: Match): Match => {
    if (m.participants) {
        m.participants.forEach(p => {
            if (p.name) p.name = sanitizeTeamName(p.name);
        });
    }
    return m;
};

const sanitizeScorecard = (sc: Scorecard): Scorecard => {
    if (sc.Teams) {
        Object.values(sc.Teams).forEach(team => {
            if (team.Name_Full) team.Name_Full = sanitizeTeamName(team.Name_Full);
        });
    }
    return sc;
};

const fetchWithRetry = async (url: string, retries: number = 1, bypassCache = false): Promise<MatchesResponse> => {
    for (let i = 0; i <= retries; i++) {
        try {
            return await proxyFetch(url, bypassCache);
        } catch (e) {
            if (i === retries) throw e;
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
    return { matches: [] };
};

interface UseCricketDataReturn {
    matches: Match[];
    loading: boolean;
    fetchScorecard: (gameId: string) => Promise<Scorecard | null>;
    fetchExtendedResults: (chunks?: number) => Promise<Match[]>;
    // Centralized fetch functions
    fetchWallstream: (gameId: string, pageSize?: number, innings?: number) => Promise<WallstreamData>;
    fetchH2H: (gameId: string) => Promise<H2HData | null>;
    fetchSquad: (teamId: string, seriesId: string) => Promise<SquadData | null>;
    fetchBatsmanSplits: (gameId: string, innings: number) => Promise<BatsmanSplitsResponse | null>;
    fetchOverByOver: (gameId: string, innings: number) => Promise<OverByOverResponse | null>;
}

export default function useCricketData(): UseCricketDataReturn {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // BUCKETS STATE: Store data in separate silos to prevent "ghost" records
    const bucketsRef = useRef({
        live: [] as Match[],
        upcoming: [] as Match[],
        completed: new Map<string, Match>() // Map to support deduping and pagination
    });

    const initialLoadComplete = useRef<boolean>(false);

    // Re-combine all buckets into a single list
    const recomputeMatches = () => {
        const { live, upcoming, completed } = bucketsRef.current;
        // Start with Completed as base (lowest priority)
        const merged = new Map<string, Match>(completed);

        // Priority 2: Upcoming matches (Overwrites Completed if collision)
        upcoming.forEach(m => merged.set(m.game_id, m));

        // Priority 1: Live matches (Overwrites Upcoming/Completed - Source of Truth)
        live.forEach(m => merged.set(m.game_id, m));

        const finalArray = Array.from(merged.values());
        setMatches(finalArray);
        safeSetItem(CACHE_KEY, JSON.stringify(finalArray));
    };

    const updateBucket = (type: 'live' | 'upcoming' | 'completed', newMatches: Match[]) => {
        // Sanitize first
        const sanitized = newMatches.map(sanitizeMatch);

        if (type === 'live') {
            bucketsRef.current.live = sanitized;
        } else if (type === 'upcoming') {
            bucketsRef.current.upcoming = sanitized;
        } else if (type === 'completed') {
            // For completed, we MERGE because of pagination/history
            sanitized.forEach(m => bucketsRef.current.completed.set(m.game_id, m));
        }

        recomputeMatches();

        if (loading) {
            setLoading(false);
            initialLoadComplete.current = true;
        }
    };

    // Fast fetch for LIVE matches only - REPLACES Live Bucket
    const fetchLive = async (): Promise<void> => {
        try {
            const data = await fetchWithRetry(`${WISDEN_MATCHES}&gamestate=1`, 0, true);
            if (data?.matches) {
                updateBucket('live', data.matches);
            }
        } catch (e) {
            console.error('Live fetch error', e);
        }
    };

    // Heavy fetch for Schedule and Results
    const fetchHeavy = async (isInitial: boolean = false): Promise<void> => {
        try {
            const today = new Date();
            const past = new Date();
            past.setDate(today.getDate() - 30);
            const dateRange = `${formatDate(past)}-${formatDate(today)}`;

            const [upcoming, results] = await Promise.allSettled([
                fetchWithRetry(`${WISDEN_MATCHES}&gamestate=2&days=10`),
                fetchWithRetry(`${WISDEN_MATCHES}&daterange=${dateRange}`)
            ]);

            if (upcoming.status === 'fulfilled' && upcoming.value?.matches) {
                // Completely REPLACE upcoming bucket (removes ghost matches)
                updateBucket('upcoming', upcoming.value.matches);
            }

            if (results.status === 'fulfilled' && results.value?.matches) {
                // Merge into completed bucket
                updateBucket('completed', results.value.matches);
            }

            if (isInitial) {
                setLoading(false);
                initialLoadComplete.current = true;
            }
        } catch (e) {
            console.error('Heavy fetch error', e);
            if (isInitial && !initialLoadComplete.current) {
                setLoading(false);
            }
        }
    };

    // Use preloaded data from HTML script
    const usePreloadedData = async (): Promise<boolean> => {
        const preload = window.__preloadData;
        if (!preload) return false;

        try {
            const [live, upcoming, results] = await Promise.all([
                preload.live,
                preload.upcoming,
                preload.results
            ]);

            if (live?.matches) updateBucket('live', live.matches);
            if (upcoming?.matches) updateBucket('upcoming', upcoming.matches);
            if (results?.matches) updateBucket('completed', results.matches);

            return true;
        } catch (e) {
            console.error('Preload error', e);
        }
        return false;
    };

    useEffect(() => {
        // 1. Try cache first (instant)
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed: Match[] = JSON.parse(cached);
                if (parsed.length > 0) {
                    // Smart Hydration: Distribute to correct buckets
                    // This allows auto-clearing of ghosts when API updates specific buckets
                    const cachedLive: Match[] = [];
                    const cachedUpcoming: Match[] = [];

                    parsed.forEach(m => {
                        if (m.event_state === 'L' || m.event_state === 'I') {
                            cachedLive.push(m);
                        } else if (m.event_state === 'U') {
                            cachedUpcoming.push(m);
                        } else {
                            bucketsRef.current.completed.set(m.game_id, m);
                        }
                    });

                    bucketsRef.current.live = cachedLive;
                    bucketsRef.current.upcoming = cachedUpcoming;

                    setMatches(parsed);
                    setLoading(false);
                    initialLoadComplete.current = true;
                }
            } catch (e) { }
        }

        // 2. Use preloaded data (started in HTML, should be ready or almost ready)
        usePreloadedData().then(usedPreload => {
            if (!usedPreload) {
                // 3. Fallback to normal fetch if preload failed
                fetchLive();
                fetchHeavy(true);
            }
        });

        // ADAPTIVE POLLING: Adjust interval based on live match count
        let liveTimerId: ReturnType<typeof setTimeout> | null = null;

        const scheduleNextLivePoll = () => {
            const hasLiveMatches = bucketsRef.current.live.length > 0;
            const interval = hasLiveMatches ? LIVE_INTERVAL_FAST : LIVE_INTERVAL_SLOW;

            console.log(`[Engine A] Next poll in ${interval / 1000}s (${hasLiveMatches ? 'FAST: live matches exist' : 'SLOW: no live matches'})`);

            liveTimerId = setTimeout(() => {
                fetchLive();
                scheduleNextLivePoll(); // Schedule next poll after this one completes
            }, interval);
        };

        // Start adaptive polling
        scheduleNextLivePoll();

        // Heavy refresh stays on fixed interval
        const heavyTimer = setInterval(() => fetchHeavy(false), FULL_REFRESH_INTERVAL);

        // VISIBILITY HANDLER: Refresh match list when app returns from background
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[Engine A] Visibility change detected - fetching immediately');
                // PWA visibility refresh - always fetch immediately
                fetchLive();
                // Reschedule polling with fresh interval check
                if (liveTimerId) clearTimeout(liveTimerId);
                scheduleNextLivePoll();
            }
        };

        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                console.log('[Engine A] PageShow (BFCache) detected - fetching immediately');
                // PWA BFCache refresh
                fetchLive();
                fetchHeavy(false);
                // Reschedule polling
                if (liveTimerId) clearTimeout(liveTimerId);
                scheduleNextLivePoll();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pageshow', handlePageShow);

        return () => {
            if (liveTimerId) clearTimeout(liveTimerId);
            clearInterval(heavyTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, []);


    // Always bypass cache for live scorecard data
    const fetchScorecard = async (gameId: string): Promise<Scorecard | null> => {
        try {
            const data = await proxyFetch(`${WISDEN_SCORECARD}${gameId}`, true);
            if (data?.data) {
                return sanitizeScorecard(data.data);
            }
            return null;
        } catch (err) {
            return null;
        }
    };

    // Fetch extended date range (chained 30-day calls)
    // chunks: 2 = 60 days, 3 = 90 days
    const fetchExtendedResults = async (chunks: number = 2): Promise<Match[]> => {
        const allMatches: Match[] = [];
        const today = new Date();

        const fetchPromises: Promise<Match[]>[] = [];
        for (let i = 0; i < chunks; i++) {
            const endDate = new Date(today);
            endDate.setDate(today.getDate() - (i * 30));
            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 29); // 30 day range

            const dateRange = `${formatDate(startDate)}-${formatDate(endDate)}`;
            fetchPromises.push(
                fetchWithRetry(`${WISDEN_MATCHES}&daterange=${dateRange}`)
                    .then(data => data?.matches || [])
                    .catch(() => [])
            );
        }

        const results = await Promise.all(fetchPromises);
        results.forEach(matches => allMatches.push(...matches));

        // Dedupe by game_id and merge with existing
        // For extended results, we just update the completed bucket
        updateBucket('completed', allMatches);

        // Return full list
        const { live, upcoming, completed } = bucketsRef.current;
        return Array.from(completed.values());
    };

    // ============ CENTRALIZED FETCH FUNCTIONS ============

    // Wallstream - moved from wallstreamApi.ts
    const WALLSTREAM_CLIENT = 'lx/QMpdauKZQKYaddAs76w==';

    const parseBallValue = (ball: string): string => {
        if (!ball) return '';
        const match = ball.match(/\d*\((.+)\)/);
        if (match) return match[1];
        return ball;
    };

    const fetchWallstream = useCallback(async (gameId: string, pageSize = 10, innings = 1): Promise<WallstreamData> => {
        try {
            const matchId = extractMatchId(gameId);
            const url = `https://www.wisden.com/functions/wallstream/?sport_id=1&client_id=${encodeURIComponent(WALLSTREAM_CLIENT)}&match_id=${matchId}&page_size=${pageSize}&page_no=1&session=${innings}`;
            const data = await proxyFetch(url, true);

            if (!data?.assets || !Array.isArray(data.assets)) {
                return { balls: [], latestBall: null };
            }

            const balls: BallData[] = data.assets
                .filter((a: any) => a.type === 'Commentary' && a.custom_metadata?.asset)
                .map((a: any) => {
                    try {
                        const asset = JSON.parse(a.custom_metadata.asset);
                        const thisOverStr = asset.This_Over || '';
                        const thisOverBalls = thisOverStr.split(',').filter((b: string) => b !== '').map(parseBallValue);
                        const detail = (asset.Detail || '').toLowerCase();
                        const runs = asset.Runs || '0';

                        return {
                            over: asset.Over || '',
                            runs,
                            detail,
                            commentary: asset.Commentary || '',
                            batsmanName: asset.Batsman_Details?.name || asset.Batsman_Name || '',
                            batsmanRuns: asset.Batsman_Details?.Runs || '0',
                            batsmanBalls: asset.Batsman_Details?.Balls || '0',
                            batsmanFours: asset.Batsman_Details?.Fours || '0',
                            batsmanSixes: asset.Batsman_Details?.Sixes || '0',
                            nonStrikerName: asset.Non_Striker_Details?.name || '',
                            nonStrikerRuns: asset.Non_Striker_Details?.Runs || '0',
                            nonStrikerBalls: asset.Non_Striker_Details?.Balls || '0',
                            bowlerName: asset.Bowler_Details?.name || asset.Bowler_Name || '',
                            bowlerOvers: asset.Bowler_Details?.Overs || '0',
                            bowlerRuns: asset.Bowler_Details?.Runs || '0',
                            bowlerWickets: asset.Bowler_Details?.Wickets || '0',
                            bowlerMaidens: asset.Bowler_Details?.Maidens || '0',
                            thisOver: thisOverBalls,
                            currentScore: asset.Over_Summary?.Score?.split('/')[0] || '',
                            currentWickets: asset.Over_Summary?.Score?.split('/')[1] || '',
                            isWicket: detail === 'w',
                            isFour: runs === '4' || asset.Isboundary === true,
                            isSix: runs === '6',
                            isball: asset.Isball === true,
                            batsmanId: asset.Batsman_Details?.id || asset.Batsman || '',
                            nonStrikerId: asset.Non_Striker_Details?.id || '',
                            bowlerId: asset.Bowler_Details?.id || asset.Bowler || '',
                        };
                    } catch { return null; }
                })
                .filter((b: BallData | null) => b !== null) as BallData[];

            return { balls, latestBall: balls.find(b => b.isball) || null };
        } catch (error) {
            console.error('Wallstream fetch error:', error);
            return { balls: [], latestBall: null };
        }
    }, []);

    // H2H - moved from h2hApi.ts
    const fetchH2H = useCallback(async (gameId: string): Promise<H2HData | null> => {
        try {
            const url = `https://www.wisden.com/cricket/v1/game/head-to-head?client_id=${CLIENT_SCORECARD}&feed_format=json&game_id=${gameId}&lang=en`;
            const response = await proxyFetch(url);
            if (!response?.data) return null;

            // Sanitize team names in H2H data
            const h2h = response.data as H2HData;
            if (h2h.team?.head_to_head?.comp_type?.data) {
                h2h.team.head_to_head.comp_type.data.forEach((t: any) => {
                    if (t.name) t.name = sanitizeTeamName(t.name);
                });
            }
            if (h2h.team?.head_to_head?.venue?.data) {
                h2h.team.head_to_head.venue.data.forEach((t: any) => {
                    if (t.name) t.name = sanitizeTeamName(t.name);
                });
            }
            return h2h;
        } catch (error) {
            console.error('H2H fetch error:', error);
            return null;
        }
    }, []);

    // Batsman Splits - for wagon wheel and matchups
    const fetchBatsmanSplits = useCallback(async (gameId: string, innings: number): Promise<BatsmanSplitsResponse | null> => {
        try {
            const matchFile = gameId.replace(/[^a-z0-9]/gi, '');
            const url = `https://www.wisden.com/cricket/live/json/${matchFile}_batsman_splits_${innings}.json`;
            const data = await proxyFetch(url);
            return data as BatsmanSplitsResponse;
        } catch (error) {
            console.warn(`Failed to fetch batsman splits for innings ${innings}:`, error);
            return null;
        }
    }, []);

    // Over-by-Over - for innings progression
    const fetchOverByOver = useCallback(async (gameId: string, innings: number): Promise<OverByOverResponse | null> => {
        const matchFile = gameId.replace(/[^a-z0-9]/gi, '');
        const url = `https://www.wisden.com/cricket/live/json/${matchFile}_overbyover_${innings}.json`;

        // console.log(`[OBO_DEBUG] Fetching: ${url}`);

        try {
            const data = await proxyFetch(url);
            // console.log(`[OBO_DEBUG] Success. Data keys:`, Object.keys(data || {}));
            return data as OverByOverResponse;
        } catch (error) {
            console.error(`[OBO_DEBUG] Failed to fetch over-by-over for innings ${innings}. URL: ${url}`, error);
            return null;
        }
    }, []);

    // Squad - for team lineups
    const fetchSquad = useCallback(async (teamId: string, seriesId: string): Promise<SquadData | null> => {
        try {
            const url = `https://www.wisden.com/cricket/v1/series/squad?team_id=${teamId}&series_id=${seriesId}&lang=en&feed_format=json&client_id=${CLIENT_SCORECARD}`;
            const response = await proxyFetch(url);

            if (!response?.data?.squads?.teams?.team) return null;

            const teamData = response.data.squads.teams.team[0];
            if (!teamData) return null;

            const players = teamData.players?.player || [];

            return {
                team_id: parseInt(teamId),
                team_name: sanitizeTeamName(teamData.name || ''),
                team_short_name: teamData.short_name || '',
                players: players.map((p: any) => ({
                    player_id: parseInt(p.id) || 0,
                    player_name: p.name || p.full_display_name,
                    short_name: p.short_name || p.name,
                    role: p.role || p.skill_name,
                    skill: p.skill_name,
                    batting_style: p.sport_specific_keys?.batting_style,
                    bowling_style: p.sport_specific_keys?.bowling_style,
                    is_captain: p.sport_specific_keys?.is_captain === 'true',
                    is_keeper: p.sport_specific_keys?.is_wicket_keeper === 'true'
                }))
            };
        } catch (error) {
            console.error('Failed to fetch squad data:', error);
            return null;
        }
    }, []);

    return {
        matches,
        loading,
        fetchScorecard,
        fetchExtendedResults,
        fetchWallstream,
        fetchH2H,
        fetchSquad,
        fetchBatsmanSplits,
        fetchOverByOver
    };
}

// Re-export Supabase match database functions for convenience
export { getTeamForm, getTeamMatches, getH2HMatches, getMatchesByLeague } from './matchDatabase';
