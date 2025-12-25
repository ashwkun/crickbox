import { useState, useEffect, useRef } from 'react';
import { WISDEN_MATCHES, WISDEN_SCORECARD, proxyFetch } from './api';
import { safeSetItem } from './storage';

const CACHE_KEY = 'wisden_matches_v5';
const LIVE_INTERVAL = 15000; // 15 seconds for live scores
const FULL_REFRESH_INTERVAL = 300000; // 5 minutes for schedule/results

// Helper to format date
const formatDate = (date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}${m}${y}`;
};

const fetchWithRetry = async (url, retries = 1) => {
    for (let i = 0; i <= retries; i++) {
        try {
            return await proxyFetch(url);
        } catch (e) {
            if (i === retries) throw e;
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
};

export default function useCricketData() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const matchesRef = useRef(new Map()); // Use ref to avoid stale state in intervals

    const updateState = (newMatches) => {
        newMatches.forEach(m => matchesRef.current.set(m.game_id, m));
        const merged = Array.from(matchesRef.current.values());
        setMatches(merged);
        safeSetItem(CACHE_KEY, JSON.stringify(merged));
        setLoading(false);
    };

    // Fast fetch for LIVE matches only
    const fetchLive = async () => {
        try {
            const data = await fetchWithRetry(`${WISDEN_MATCHES}&gamestate=1`, 0);
            if (data?.matches) {
                updateState(data.matches);
            }
        } catch (e) { console.error('Live fetch error', e); }
    };

    // Heavy fetch for Schedule and Results
    const fetchHeavy = async () => {
        try {
            const today = new Date();
            const past = new Date();
            past.setDate(today.getDate() - 30);
            const dateRange = `${formatDate(past)}-${formatDate(today)}`;

            const [upcoming, results] = await Promise.allSettled([
                fetchWithRetry(`${WISDEN_MATCHES}&gamestate=2&days=10`),
                fetchWithRetry(`${WISDEN_MATCHES}&daterange=${dateRange}`)
            ]);

            const newItems = [];
            if (upcoming.status === 'fulfilled' && upcoming.value?.matches) {
                newItems.push(...upcoming.value.matches);
            }
            if (results.status === 'fulfilled' && results.value?.matches) {
                newItems.push(...results.value.matches);
            }

            if (newItems.length > 0) updateState(newItems);
        } catch (e) { console.error('Heavy fetch error', e); }
    };

    useEffect(() => {
        // Initial cache load
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                parsed.forEach(m => matchesRef.current.set(m.game_id, m));
                setMatches(parsed);
                setLoading(false);
            } catch (e) { }
        }

        // Initial fetches
        fetchLive();
        fetchHeavy();

        // Intervals
        const liveTimer = setInterval(fetchLive, LIVE_INTERVAL);
        const heavyTimer = setInterval(fetchHeavy, FULL_REFRESH_INTERVAL);

        return () => {
            clearInterval(liveTimer);
            clearInterval(heavyTimer);
        };
    }, []);

    const fetchScorecard = async (gameId) => {
        try {
            const data = await proxyFetch(`${WISDEN_SCORECARD}${gameId}`);
            return data.data;
        } catch (err) {
            return null;
        }
    };

    return { matches, loading, fetchScorecard };
}
