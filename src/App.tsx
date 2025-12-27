import React, { useState, useEffect, useCallback, useRef } from 'react';
import HomePage from './components/HomePage';
import InstallPrompt from './components/InstallPrompt';
import MatchDetail from './components/MatchDetail';
import FloatingHeader from './components/FloatingHeader';
import useCricketData from './utils/useCricketData';
import { fetchWallstream, WallstreamData } from './utils/wallstreamApi';
import { Match, Scorecard, Series, Tournament } from './types';

export default function App(): React.ReactElement {
    const { matches, loading, fetchScorecard, fetchExtendedResults } = useCricketData();
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [scorecard, setScorecard] = useState<Scorecard | null>(null);
    const [wallstream, setWallstream] = useState<WallstreamData | null>(null);
    const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);

    // Navigation State (Lifted from HomePage)
    const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

    // Parse URL on initial load to get pending match ID
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const matchId = params.get('match');
        if (matchId) {
            setPendingMatchId(matchId);
        }

        // Push initial state so back button doesn't close app immediately
        if (!window.history.state) {
            window.history.replaceState({ home: true }, '', window.location.pathname + window.location.search);
        }
    }, []);

    // Once matches are loaded, restore the pending match
    useEffect(() => {
        if (pendingMatchId && matches.length > 0) {
            const match = matches.find(m => m.game_id === pendingMatchId);
            if (match) {
                setSelectedMatch(match);
            }
            setPendingMatchId(null);
        }
    }, [pendingMatchId, matches]);

    // Handle browser back/forward buttons (Consolidated)
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const params = new URLSearchParams(window.location.search);
            const matchId = params.get('match');
            const seriesId = params.get('series');
            const tournamentId = params.get('tournament');

            // Handle Match
            if (matchId) {
                const match = matches.find(m => m.game_id === matchId);
                if (match) {
                    setSelectedMatch(match);
                } else {
                    setSelectedMatch(null);
                }
            } else {
                setSelectedMatch(null);
            }

            // Handle Series
            if (seriesId) {
                if (selectedSeries?.seriesId !== seriesId) {
                    // We might need to fetch series data if restoring from URL, but 
                    // for now assume if we are just popping state, we might lose data if not cached.
                    // A robust solution would re-fetch/filter here.
                    // For simplicity, if we pop back to a series URL but don't have state, we might just be on home.
                    // Ideally we should reconstruct state from matches prop if possible.
                    // The simple version: relying on the fact that we have 'matches'
                    const seriesMatches = matches.filter(m => m.series_id === seriesId);
                    if (seriesMatches.length > 0) {
                        setSelectedSeries({ seriesId, seriesName: seriesMatches[0].series_name, matches: seriesMatches });
                    }
                }
            } else if (!event.state?.seriesId) {
                setSelectedSeries(null);
            }

            // Handle Tournament
            if (tournamentId) {
                if (selectedTournament?.seriesId !== tournamentId) {
                    const tourMatches = matches.filter(m => m.series_id === tournamentId);
                    if (tourMatches.length > 0) {
                        setSelectedTournament({ seriesId: tournamentId, tournamentName: tourMatches[0].series_name, matches: tourMatches });
                    }
                }
            } else if (!event.state?.tournamentId) {
                setSelectedTournament(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [matches, selectedSeries, selectedTournament]);

    // Ref to store current loadData function for visibility handler
    const loadDataRef = useRef<(() => void) | null>(null);

    // Fetch scorecard and wallstream together for live/completed matches
    // For live matches, refresh every 10 seconds - SYNCHRONIZED
    useEffect(() => {
        if (!selectedMatch) {
            setScorecard(null);
            setWallstream(null);
            loadDataRef.current = null;
            return;
        }

        const isLive = selectedMatch.event_state === 'L';
        const isCompleted = selectedMatch.event_state === 'C';

        if (!isLive && !isCompleted) {
            setScorecard(null);
            setWallstream(null);
            loadDataRef.current = null;
            return;
        }

        let intervalId: ReturnType<typeof setInterval> | null = null;
        let isMounted = true;
        let currentInningsCount = 1;

        // Fetch both scorecard and wallstream together
        const loadData = async () => {
            console.log('[PWA] Loading data for match:', selectedMatch.game_id);
            const sc = await fetchScorecard(selectedMatch.game_id);

            // Update innings count from fresh scorecard
            if (sc?.Innings?.length) {
                currentInningsCount = sc.Innings.length;
            }

            const ws = isLive
                ? await fetchWallstream(selectedMatch.game_id, 50, currentInningsCount)
                : null;

            if (isMounted) {
                setScorecard(sc);
                setWallstream(isLive ? ws : null);
            }
        };

        // Store loadData in ref so visibility handler can call it
        loadDataRef.current = loadData;

        // Initial load
        loadData();

        // For live matches, poll every 10 seconds
        if (isLive) {
            intervalId = setInterval(loadData, 10000);
        }

        return () => {
            isMounted = false;
            loadDataRef.current = null;
            if (intervalId) clearInterval(intervalId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMatch?.game_id, selectedMatch?.event_state]);

    // VISIBILITY HANDLER: Refresh data when app returns from background
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[PWA] App visible, refreshing data...');
                // Call the current loadData function if available
                if (loadDataRef.current) {
                    loadDataRef.current();
                }
            }
        };

        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                console.log('[PWA] Page restored from BFCache, refreshing...');
                if (loadDataRef.current) {
                    loadDataRef.current();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pageshow', handlePageShow);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, []);

    // Handle match selection with URL update
    const handleSelectMatch = useCallback((match: Match) => {
        // Clear scorecard immediately to prevent showing stale data
        setScorecard(null);
        setSelectedMatch(match);
        window.history.pushState({ matchId: match.game_id }, '', `?match=${match.game_id}`);
    }, []);

    // Handle closing detail view with URL update
    const handleCloseMatch = useCallback(() => {
        setSelectedMatch(null);
        // Use pushState to add to history, allowing forward navigation
        // If we came from a series/tournament, we might want to preserve that in URL?
        // Using replaceState might be safer if we want to just 'close' the modal but stay on current URL (if it was series URL)
        // But since MatchDetail overlays everything, if we are in Series view, the URL is ?series=X.
        // Selecting match changes URL to ?match=Y.
        // Closing match should ideally go back to ?series=X.
        window.history.back();
    }, []);

    // --- Series / Tournament Handlers ---

    // Helper to check if series is bilateral
    const isBilateral = (seriesMatches: Match[]): boolean => {
        const uniqueTeams = new Set<string>();
        seriesMatches.forEach(m => {
            m.participants?.forEach(p => uniqueTeams.add(p.short_name));
        });
        return uniqueTeams.size <= 2;
    };

    const handleOpenSeries = async (seriesId: string, seriesMatches?: Match[]) => {
        // If match detail is open, close it (but keep history clean?)
        if (selectedMatch) {
            setSelectedMatch(null);
            // Don't modify history yet as we are about to push new state
        }

        const initialMatches = seriesMatches || matches.filter(m => m.series_id === seriesId);

        // Smart Detection: If not bilateral, treat as Tournament
        if (!isBilateral(initialMatches)) {
            handleOpenTournament(seriesId);
            return;
        }

        const seriesName = initialMatches[0]?.series_name || 'Series';

        setSelectedSeries({ seriesId, seriesName, matches: initialMatches });
        window.history.pushState({ seriesId }, '', `?series=${seriesId}`);
        window.scrollTo(0, 0);

        const extendedMatches = await fetchExtendedResults(2);
        const allSeriesMatches = extendedMatches.filter(m => m.series_id === seriesId);

        // Check again after extended fetch? Likely initial check is enough.
        setSelectedSeries(prev => prev ? { ...prev, matches: allSeriesMatches } : null);
    };

    const handleCloseSeries = () => {
        setSelectedSeries(null);
        if (window.history.state?.seriesId) {
            window.history.back();
        }
    };

    const handleOpenTournament = async (seriesId: string) => {
        if (selectedMatch) {
            setSelectedMatch(null);
        }

        const initialMatches = matches.filter(m => m.series_id === seriesId);
        const tournamentName = initialMatches[0]?.series_name || 'Tournament';

        setSelectedTournament({ seriesId, tournamentName, matches: initialMatches });
        window.history.pushState({ tournamentId: seriesId }, '', `?tournament=${seriesId}`);
        window.scrollTo(0, 0);

        const extendedMatches = await fetchExtendedResults(3);
        const allTournamentMatches = extendedMatches.filter(m => m.series_id === seriesId);
        setSelectedTournament(prev => prev ? { ...prev, matches: allTournamentMatches } : null);
    };

    const handleCloseTournament = () => {
        setSelectedTournament(null);
        if (window.history.state?.tournamentId) {
            window.history.back();
        }
    };

    return (
        <div className="app-container">
            {/* Floating Header */}
            <FloatingHeader
                showBack={!!selectedMatch || !!selectedSeries || !!selectedTournament}
                onBack={() => {
                    if (selectedMatch) handleCloseMatch();
                    else if (selectedSeries) handleCloseSeries();
                    else if (selectedTournament) handleCloseTournament();
                }}
                onLogoClick={() => setShowInstallPrompt(true)}
            />

            {/* Main Content */}
            <main className="main-content" style={{ paddingTop: 85 }}>
                <HomePage
                    matches={matches}
                    loading={loading}
                    fetchExtendedResults={fetchExtendedResults}
                    onSelectMatch={handleSelectMatch}

                    // State passed down
                    selectedSeries={selectedSeries}
                    selectedTournament={selectedTournament}
                    onOpenSeries={handleOpenSeries}
                    onCloseSeries={handleCloseSeries}
                    onOpenTournament={handleOpenTournament}
                    onCloseTournament={handleCloseTournament}
                />
            </main>

            {/* Detail Overlay */}
            {selectedMatch && (
                <MatchDetail
                    match={selectedMatch}
                    scorecard={scorecard}
                    wallstream={wallstream}
                    onClose={handleCloseMatch}
                    onSeriesClick={handleOpenSeries}
                />
            )}

            {/* Footer */}
            {!selectedMatch && !selectedSeries && !selectedTournament && (
                <footer className="app-footer">
                    box.cric © {new Date().getFullYear()}
                </footer>
            )}

            {/* PWA Install Prompt */}
            <InstallPrompt forceShow={showInstallPrompt} onClose={() => setShowInstallPrompt(false)} />

            {/* Sticky Reload Button */}
            <button
                onClick={() => window.location.reload()}
                style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(24, 24, 27, 0.7)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                    zIndex: 2500,
                    transition: 'transform 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(39, 39, 42, 0.8)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(24, 24, 27, 0.7)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Reload Page"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
            </button>
        </div>
    );
}

