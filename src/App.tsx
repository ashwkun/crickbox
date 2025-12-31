import React, { useState, useEffect, useCallback, useRef } from 'react';
import HomePage from './components/HomePage';
import InstallPrompt from './components/InstallPrompt';
import MatchDetail from './components/MatchDetail';
import FloatingHeader, { HeaderDisplayData } from './components/FloatingHeader';
import { ENABLE_SIMULATION_MODE } from './utils/wisdenConfig';
import useCricketData from './utils/useCricketData';
import { WallstreamData } from './utils/wallstreamApi';
import { Match, Scorecard, Series, Tournament } from './types';
// Stub wallstream data for forceLive testing
import stubWallstream from '../api_samples/core/wallstream.json';
import UpcomingListPage from './components/upcoming/UpcomingListPage';

export default function App(): React.ReactElement {
    const { matches, loading, fetchScorecard, fetchExtendedResults, fetchWallstream } = useCricketData();
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [headerData, setHeaderData] = useState<HeaderDisplayData | null>(null);
    const [scorecard, setScorecard] = useState<Scorecard | null>(null);
    const [wallstream, setWallstream] = useState<WallstreamData | null>(null);
    const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);

    // Navigation State (Lifted from HomePage)
    const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [showUpcomingList, setShowUpcomingList] = useState(false);

    // Parse URL on initial load to get pending match ID
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const matchId = params.get('match');
        if (matchId) {
            setPendingMatchId(matchId);
        }

        // Check for upcoming list page
        const upcomingParam = params.get('upcoming');
        if (upcomingParam === 'true') {
            setShowUpcomingList(true);
        }

        // Push initial state so back button doesn't close app immediately
        if (!window.history.state) {
            window.history.replaceState({ home: true }, '', window.location.pathname + window.location.search);
        }
    }, []);

    // Once matches are loaded, restore the pending match
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const forceLive = params.get('forceLive') === 'true';

        // For forceLive, allow stub creation even before matches load
        if (pendingMatchId && (matches.length > 0 || forceLive)) {
            const match = matches.find(m => m.game_id === pendingMatchId);
            // ForceLive check

            if (match) {
                if (forceLive) {
                    // Overriding to LIVE
                    setSelectedMatch({ ...match, event_state: 'L' });
                } else {
                    setSelectedMatch(match);
                }
            } else if (forceLive) {
                // Create stub match for forceLive testing (India W vs Sri Lanka W)
                // Creating stub match
                setSelectedMatch({
                    game_id: pendingMatchId,
                    event_state: 'L', // Force as live
                    event_format: 't20',
                    series_id: '13512',
                    series_name: 'Sri Lanka Women in India, 5 T20I Series, 2025',
                    event_name: '5th T20I',
                    short_status: 'Test Mode',
                    venue_name: 'Greenfield International Stadium',
                    participants: [
                        { id: '1126', name: 'India Women', short_name: 'IND-W', value: '221/2' },
                        { id: '1133', name: 'Sri Lanka Women', short_name: 'SL-W', value: '191/5' }
                    ]
                } as Match);
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

            // Handle Upcoming List
            const upcomingParam = params.get('upcoming');
            if (upcomingParam === 'true') {
                setShowUpcomingList(true);
            } else if (!event.state?.upcoming) {
                setShowUpcomingList(false);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [matches, selectedSeries, selectedTournament]);

    // Simulation Effect: Manual Control (God Mode)
    // We expose a function or render a UI to inject balls
    const [simPanelOpen, setSimPanelOpen] = useState(false);

    const handleSimInject = useCallback((outcome: string) => {
        if (!selectedMatch || !scorecard) return;

        setScorecard(prev => {
            if (!prev || !prev.Innings) return prev;
            const newSc = JSON.parse(JSON.stringify(prev));
            const inn = newSc.Innings[newSc.Innings.length - 1];

            // Logic for Runs/Extras
            let total = parseInt(inn.Total || '0');
            let wicks = parseInt(inn.Wickets || '0');

            const isWide = outcome === 'WD';
            const isNoBall = outcome === 'NB';
            const isBye = outcome === 'B' || outcome === 'LB';
            const isWicket = outcome === 'W';

            let runs = 0;
            if (!isNaN(parseInt(outcome))) runs = parseInt(outcome);
            else if (isWide || isNoBall) runs = 1; // Basic extra

            if (isWicket) wicks += 1;
            else total += runs;

            // Update Overs (Simple logic: .6 -> next over)
            // Assuming 6 ball over
            let oversStr = inn.Overs || '0.0';
            if (!oversStr.includes('.')) oversStr += '.0';

            let [ov, bl] = oversStr.split('.').map((n: string) => parseInt(n));
            if (isNaN(ov)) ov = 0;
            if (isNaN(bl)) bl = 0;

            if (!isWide && !isNoBall) {
                bl += 1;
                if (bl >= 6) {
                    bl = 0;
                    ov += 1;
                }
            }
            inn.Overs = `${ov}.${bl}`;

            inn.Total = total.toString();
            inn.Wickets = wicks.toString();

            // Update Bowler ThisOver
            if (inn.Bowlers && inn.Bowlers.length > 0) {
                let bowler = inn.Bowlers.find((b: any) => b.Isbowlingnow);
                if (!bowler) {
                    bowler = inn.Bowlers[inn.Bowlers.length - 1];
                    if (bowler) bowler.Isbowlingnow = true;
                }

                if (bowler) {
                    // Manual inject simulation
                    if (!bowler.ThisOver) bowler.ThisOver = [];
                    if (bowler.ThisOver.length >= 8) bowler.ThisOver = [];

                    // Display Text
                    let disp = outcome;
                    if (isWide) disp = 'WD'; // or 1WD
                    else if (isNoBall) disp = 'NB';
                    else if (isBye) disp = 'LB';

                    bowler.ThisOver.push({ T: disp, B: isWicket ? '0' : runs.toString() });
                }
            }

            return newSc;
        });
    }, [selectedMatch, scorecard]);

    // Check if Sim Mode Active for UI rendering
    const showSimControls = ENABLE_SIMULATION_MODE && (new URLSearchParams(window.location.search).get('forceLive') === 'true');

    // Ref to store current loadData function for visibility handler
    const loadDataRef = useRef<(() => void) | null>(null);
    const hasLoadedBaseData = useRef(false);

    // Fetch scorecard and wallstream together for live/completed matches
    // For live matches, refresh every 10 seconds - SYNCHRONIZED
    useEffect(() => {
        // Match selection changed
        if (!selectedMatch) {
            setScorecard(null);
            setWallstream(null);
            loadDataRef.current = null;
            return;
        }

        const isLive = selectedMatch.event_state === 'L';
        const isCompleted = selectedMatch.event_state === 'C' || selectedMatch.event_state === 'R';
        // Live/completed state

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
            // Check for forceLive mode
            const params = new URLSearchParams(window.location.search);
            const forceLive = params.get('forceLive') === 'true';

            if (forceLive && ENABLE_SIMULATION_MODE && hasLoadedBaseData.current) {
                // Sim mode, skip fetch
                return;
            }

            // Loading match data
            const sc = await fetchScorecard(selectedMatch.game_id);

            if (sc) hasLoadedBaseData.current = true;

            // Update innings count from fresh scorecard
            if (sc?.Innings?.length) {
                currentInningsCount = sc.Innings.length;
            }



            let ws: WallstreamData | null = null;
            if (isLive) {
                ws = await fetchWallstream(selectedMatch.game_id, 50, currentInningsCount);
            } else if (forceLive) {
                // Use stub wallstream for testing completed matches
                ws = stubWallstream as WallstreamData;
            }

            if (isMounted) {
                setScorecard(sc);
                setWallstream(ws);
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
                showBack={!!selectedMatch || !!selectedSeries || !!selectedTournament || showUpcomingList}
                onBack={() => {
                    if (showUpcomingList) setShowUpcomingList(false);
                    else if (selectedMatch) handleCloseMatch();
                    else if (selectedSeries) handleCloseSeries();
                    else if (selectedTournament) handleCloseTournament();
                }}
                onLogoClick={() => window.location.href = 'https://theboxcric.web.app/?match=inwslw12282025268163&forceLive=true'}
                data={headerData}
                isLive={selectedMatch?.event_state === 'L'}
                isUpcoming={selectedMatch?.event_state === 'U' || showUpcomingList}
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
                    onOpenUpcomingList={() => {
                        setShowUpcomingList(true);
                        window.history.pushState({ upcoming: true }, '', '?upcoming=true');
                        window.scrollTo(0, 0);
                    }}
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
                    setHeaderData={setHeaderData}
                />
            )}

            {/* Upcoming List Page Overlay */}
            {showUpcomingList && (
                <UpcomingListPage
                    matches={matches.filter(m => m.event_state === 'U')}
                    onBack={() => {
                        setShowUpcomingList(false);
                        if (window.history.state?.upcoming) {
                            window.history.back();
                        }
                    }}
                    onMatchClick={(match) => {
                        // Navigate to match (will push new history entry)
                        handleSelectMatch(match);
                    }}
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

            {/* 
              RELOAD BUTTON - HIDDEN (Dec 2025)
              ================================
              Commented out after implementing automatic visibility-based refresh.
              The app now auto-refreshes data when:
              - User switches back to the app (visibilitychange event)
              - Page is restored from BFCache (pageshow event)
              
              If auto-refresh proves unreliable, uncomment to restore the button.
              
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
            */}
            {/* Simulation Controls (God Mode) */}
            {showSimControls && (
                <div
                    onClick={() => !simPanelOpen && setSimPanelOpen(true)}
                    style={{
                        position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
                        background: 'rgba(0,0,0,0.85)',
                        padding: simPanelOpen ? 12 : 10,
                        borderRadius: simPanelOpen ? 16 : 24,
                        display: 'flex', flexDirection: 'column', gap: 10,
                        backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        width: simPanelOpen ? 180 : 'auto',
                        cursor: simPanelOpen ? 'default' : 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>

                    {/* Minimized: Just icon */}
                    {!simPanelOpen && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                            <span style={{ fontSize: 14 }}>⚡</span>
                        </div>
                    )}

                    {/* Expanded: Full controls */}
                    {simPanelOpen && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                                    <span style={{ fontSize: 14 }}>⚡</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); setSimPanelOpen(false); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 4, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <span style={{ fontSize: 10 }}>✕</span>
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                                {['0', '1', '2', '3', '4', '6', 'W', 'WD', 'NB', 'LB'].map(opt => (
                                    <button key={opt}
                                        onClick={() => handleSimInject(opt)}
                                        style={{
                                            background: opt === 'W' ? '#ef4444' : (opt === '6' || opt === '4' ? '#22c55e' : 'rgba(255,255,255,0.1)'),
                                            color: '#fff', border: 'none', borderRadius: 8,
                                            height: 32, fontSize: 11, fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: 'transform 0.1s active',
                                            gridColumn: (opt === 'W' || opt === 'NB' || opt === 'LB') ? 'span 2' : 'span 1'
                                        }}
                                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

