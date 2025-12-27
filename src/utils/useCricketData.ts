import { useState, useEffect, useRef } from 'react';
import { WISDEN_MATCHES, WISDEN_SCORECARD, proxyFetch } from './api';
import { safeSetItem } from './storage';
import { Match, Scorecard, MatchesResponse } from '../types';

const CACHE_KEY = 'wisden_matches_v5';
const LIVE_INTERVAL = 15000; // 15 seconds for live scores
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
}

export default function useCricketData(): UseCricketDataReturn {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const matchesRef = useRef<Map<string, Match>>(new Map());
    const initialLoadComplete = useRef<boolean>(false);

    const updateState = (newMatches: Match[], forceLoadingOff: boolean = false): void => {
        newMatches.forEach(m => matchesRef.current.set(m.game_id, m));
        const merged = Array.from(matchesRef.current.values());
        setMatches(merged);
        safeSetItem(CACHE_KEY, JSON.stringify(merged));

        if (merged.length > 0 || forceLoadingOff) {
            setLoading(false);
            initialLoadComplete.current = true;
        }
    };

    // Fast fetch for LIVE matches only - always bypass cache
    const fetchLive = async (): Promise<void> => {
        try {
            const data = await fetchWithRetry(`${WISDEN_MATCHES}&gamestate=1`, 0, true);
            if (data?.matches) {
                updateState(data.matches, false);
            }
        } catch (e) { console.error('Live fetch error', e); }
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

            const newItems: Match[] = [];
            if (upcoming.status === 'fulfilled' && upcoming.value?.matches) {
                newItems.push(...upcoming.value.matches);
            }
            if (results.status === 'fulfilled' && results.value?.matches) {
                newItems.push(...results.value.matches);
            }

            if (newItems.length > 0) {
                updateState(newItems, isInitial);
            } else if (isInitial) {
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

            const newItems: Match[] = [];
            if (live?.matches) newItems.push(...live.matches);
            if (upcoming?.matches) newItems.push(...upcoming.matches);
            if (results?.matches) newItems.push(...results.matches);

            if (newItems.length > 0) {
                updateState(newItems, true);
                return true;
            }
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
                    parsed.forEach(m => matchesRef.current.set(m.game_id, m));
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

        // Set up intervals for refreshing (these always use fresh fetches)
        const liveTimer = setInterval(fetchLive, LIVE_INTERVAL);
        const heavyTimer = setInterval(() => fetchHeavy(false), FULL_REFRESH_INTERVAL);

        return () => {
            clearInterval(liveTimer);
            clearInterval(heavyTimer);
        };
    }, []);

    // Always bypass cache for live scorecard data
    const fetchScorecard = async (gameId: string): Promise<Scorecard | null> => {
        try {
            const data = await proxyFetch(`${WISDEN_SCORECARD}${gameId}`, true);
            return data.data;
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
        const merged = new Map(matchesRef.current);
        allMatches.forEach(m => merged.set(m.game_id, m));
        const mergedArray = Array.from(merged.values());

        // Update state with merged data
        matchesRef.current = merged;
        setMatches(mergedArray);
        safeSetItem(CACHE_KEY, JSON.stringify(mergedArray));

        return mergedArray;
    };

    return { matches, loading, fetchScorecard, fetchExtendedResults };
}
