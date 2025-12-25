import React, { useEffect, useState, useRef } from 'react';
import useCricketData from '../utils/useCricketData';
import MatchCard from './MatchCard';
import CompletedCard from './CompletedCard';
import UpcomingCard from './UpcomingCard';
import SeriesUpcomingCard from './ExpandableUpcomingCard';
import SeriesHub from './SeriesHub';
import TournamentHub from './TournamentHub';
import MatchDetail from './MatchDetail';
import SkeletonMatchCard from './SkeletonMatchCard';

// Filter for international men's matches only (no domestic, youth, or women's)
const isInternationalMens = (match) => {
    const teams = match.participants?.map(p => p.short_name || '').join(' ').toUpperCase() || '';
    const leagueCode = match.league_code?.toLowerCase() || '';

    // Exclude women's
    if (teams.includes('-W') || leagueCode.includes('women')) return false;

    // Exclude youth/U19
    if (teams.includes('-U19') || teams.includes('-U') || leagueCode.includes('youth') || leagueCode.includes('under')) return false;

    // Exclude domestic leagues
    if (leagueCode.includes('domestic') || leagueCode.includes('premier') || leagueCode.includes('trophy')) {
        // But allow Vijay Hazare since it has Test players
        if (!leagueCode.includes('hazare')) return false;
    }

    // Include ICC and international
    if (leagueCode.includes('icc')) return true;

    // Include if format is test/odi/t20 international types
    const format = match.event_format?.toLowerCase() || '';
    if (format === 'test' || format === 'odi' || format === 't20') return true;

    return true; // Default include
};

// Check if series is bilateral (2 unique teams)
const isBilateral = (matches) => {
    const uniqueTeams = new Set();
    matches.forEach(m => {
        m.participants?.forEach(p => uniqueTeams.add(p.short_name));
    });
    return uniqueTeams.size === 2;
};

// Group matches by series_id
const groupBySeries = (matches) => {
    const groups = {};
    matches.forEach(m => {
        const sid = m.series_id || 'unknown';
        if (!groups[sid]) {
            groups[sid] = [];
        }
        groups[sid].push(m);
    });
    return groups;
};

export default function Scoreboard() {
    const { matches, loading, fetchScorecard } = useCricketData();
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [scorecard, setScorecard] = useState(null);
    const [selectedSeries, setSelectedSeries] = useState(null);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [upcomingLimit, setUpcomingLimit] = useState(10);
    const [resultsLimit, setResultsLimit] = useState(8);
    const resultsScrollRef = useRef(null);

    const loadMoreResults = () => {
        const currentScrollLeft = resultsScrollRef.current?.scrollLeft || 0;
        setResultsLimit(prev => prev + 8);
        // After state update, scroll to where new cards start
        setTimeout(() => {
            if (resultsScrollRef.current) {
                resultsScrollRef.current.scrollLeft = currentScrollLeft;
            }
        }, 50);
    };

    // Navigation / History Handling
    useEffect(() => {
        const handlePopState = (event) => {
            if (event.state?.seriesId) {
                // Back from match to series
                return;
            }
            if (!event.state?.matchId) {
                setSelectedMatch(null);
                setScorecard(null);
                setSelectedSeries(null);
                setSelectedTournament(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const openMatch = async (match) => {
        setSelectedMatch(match);
        setScorecard(null);
        const data = await fetchScorecard(match.game_id);
        setScorecard(data);
        window.history.pushState({ matchId: match.game_id }, '', `?match=${match.game_id}`);
        window.scrollTo(0, 0);
    };

    const closeMatch = () => {
        if (selectedSeries || selectedTournament) {
            // Go back to series/tournament hub
            setSelectedMatch(null);
            setScorecard(null);
            window.history.back();
        } else if (window.history.state) {
            window.history.back();
        } else {
            setSelectedMatch(null);
            setScorecard(null);
        }
    };

    const openSeries = (seriesId, seriesMatches) => {
        // Get ALL matches for this series (including completed)
        const allSeriesMatches = matches.filter(m => m.series_id === seriesId);
        setSelectedSeries({
            seriesId,
            seriesName: seriesMatches[0]?.series_name || 'Series',
            matches: allSeriesMatches
        });
        window.history.pushState({ seriesId }, '', `?series=${seriesId}`);
        window.scrollTo(0, 0);
    };

    const closeSeries = () => {
        setSelectedSeries(null);
        if (window.history.state?.seriesId) {
            window.history.back();
        }
    };

    const openTournament = (seriesId) => {
        // Get ALL matches for this tournament (including completed)
        const allTournamentMatches = matches.filter(m => m.series_id === seriesId);
        const tournamentName = allTournamentMatches[0]?.series_name || 'Tournament';
        setSelectedTournament({
            seriesId,
            tournamentName,
            matches: allTournamentMatches
        });
        window.history.pushState({ tournamentId: seriesId }, '', `?tournament=${seriesId}`);
        window.scrollTo(0, 0);
    };

    const closeTournament = () => {
        setSelectedTournament(null);
        if (window.history.state?.tournamentId) {
            window.history.back();
        }
    };

    // Live Matches - international men's only, sorted by date
    const liveMatches = matches
        .filter(m => m.event_state === 'L')
        .filter(isInternationalMens)
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    // Upcoming Matches - international men's only, sorted by date
    const upcomingMatches = matches
        .filter(m => m.event_state === 'U')
        .filter(m => !m.event_status?.toLowerCase().includes('cancel') && !m.event_status?.toLowerCase().includes('abandon'))
        .filter(isInternationalMens)
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    // Completed Matches - filtered same as upcoming (International Men's)
    const completedMatches = matches
        .filter(m => {
            if (m.event_state === 'L') return false;
            // Only show completed results or cancelled/abandoned matches
            if (m.event_state === 'U') {
                const s = (m.event_status || '') + (m.event_sub_status || '');
                return s.toLowerCase().includes('cancel') || s.toLowerCase().includes('abandon');
            }
            return true;
        })
        .filter(isInternationalMens)
        .sort((a, b) => {
            const da = new Date(a.start_date);
            const db = new Date(b.start_date);
            return (db.getTime() || 0) - (da.getTime() || 0);
        })
        .slice(0, 50); // Show more since we have a good window now

    // Group upcoming by series
    const seriesGroups = groupBySeries(upcomingMatches);

    // Group completed by series
    const completedSeriesGroups = groupBySeries(completedMatches);

    // Process completed: bilateral series show latest only, tournaments show all
    const processedCompleted = [];
    const processedCompletedSeriesIds = new Set();

    completedMatches.forEach(match => {
        const sid = match.series_id || 'unknown';
        const seriesMatches = completedSeriesGroups[sid] || [match];
        const isBilateralMatch = isBilateral(seriesMatches);

        // Check if this match is part of a series (has a real series_id)
        const isPartOfSeries = sid && sid !== 'unknown';

        if (isBilateralMatch && isPartOfSeries) {
            // Bilateral series - show only latest with View Series button
            if (!processedCompletedSeriesIds.has(sid)) {
                processedCompleted.push({
                    type: 'series',
                    match: match, // Already sorted by date desc, so first is latest
                    seriesId: sid,
                    latestDate: new Date(match.start_date)
                });
                processedCompletedSeriesIds.add(sid);
            }
        } else if (!isBilateralMatch && seriesMatches.length > 1) {
            // Non-bilateral (tournament) - show each match individually with tournament button
            processedCompleted.push({
                type: 'tournament',
                match: match,
                seriesId: sid,
                latestDate: new Date(match.start_date)
            });
        } else {
            // Single match (rare) or no series_id - show individually without button
            processedCompleted.push({
                type: 'single',
                match: match,
                latestDate: new Date(match.start_date)
            });
        }
    });

    // Sort by date (most recent first)
    processedCompleted.sort((a, b) => b.latestDate - a.latestDate);

    // Process upcoming: bilateral series get grouped, tournaments get button, others stay single
    const processedUpcoming = [];
    const processedSeriesIds = new Set();

    upcomingMatches.forEach(match => {
        const sid = match.series_id || 'unknown';

        // Skip if already processed this series
        if (processedSeriesIds.has(sid)) return;

        const seriesMatches = seriesGroups[sid] || [match];

        if (seriesMatches.length > 1 && isBilateral(seriesMatches)) {
            // Bilateral with multiple matches - add as series card (only once)
            if (!processedSeriesIds.has(sid)) {
                processedUpcoming.push({
                    type: 'series',
                    matches: seriesMatches.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)),
                    firstDate: new Date(seriesMatches[0].start_date)
                });
                processedSeriesIds.add(sid);
            }
        } else if (seriesMatches.length > 1) {
            // Non-bilateral (tournament) - show each match individually with tournament button
            processedUpcoming.push({
                type: 'tournament',
                match: match,
                seriesId: sid,
                firstDate: new Date(match.start_date)
            });
        } else {
            // Single match - show individually
            processedUpcoming.push({
                type: 'single',
                match: match,
                firstDate: new Date(match.start_date)
            });
        }
    });

    // Sort by date (earliest first)
    processedUpcoming.sort((a, b) => a.firstDate - b.firstDate);

    // Tournament Hub View
    if (selectedTournament && !selectedMatch) {
        return (
            <TournamentHub
                tournamentName={selectedTournament.tournamentName}
                matches={selectedTournament.matches}
                onBack={closeTournament}
                onMatchClick={openMatch}
            />
        );
    }

    // Series Hub View
    if (selectedSeries && !selectedMatch) {
        return (
            <SeriesHub
                seriesName={selectedSeries.seriesName}
                matches={selectedSeries.matches}
                onBack={closeSeries}
                onMatchClick={openMatch}
            />
        );
    }

    // Detail View
    if (selectedMatch) {
        return <MatchDetail match={selectedMatch} scorecard={scorecard} onClose={closeMatch} />;
    }

    const heroMatch = liveMatches[0];
    const otherLiveMatches = liveMatches.slice(1);

    return (
        <>
            {/* Live Section */}
            <section className="section">
                <div className="section-header">
                    <h3 className="section-title">Live</h3>
                    <div className="section-line"></div>
                    {liveMatches.length > 0 && (
                        <span className="section-count">{liveMatches.length}</span>
                    )}
                </div>

                {loading && matches.length === 0 ? (
                    <div className="horizontal-scroll">
                        <SkeletonMatchCard />
                        <SkeletonMatchCard />
                    </div>
                ) : heroMatch ? (
                    <>
                        <MatchCard match={heroMatch} onClick={openMatch} isHero={true} />
                        {otherLiveMatches.length > 0 && (
                            <div className="horizontal-scroll" style={{ marginTop: 12 }}>
                                {otherLiveMatches.map(match => (
                                    <MatchCard key={match.game_id} match={match} onClick={openMatch} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">No live matches right now</div>
                )}
            </section>

            {/* Upcoming Section */}
            <section className="section">
                <div className="section-header">
                    <h3 className="section-title">Coming Up</h3>
                    <div className="section-line"></div>
                </div>
                {loading && matches.length === 0 ? (
                    <div className="horizontal-scroll">
                        <SkeletonMatchCard />
                        <SkeletonMatchCard />
                    </div>
                ) : processedUpcoming.length > 0 ? (
                    <div className="horizontal-scroll">
                        {processedUpcoming.slice(0, upcomingLimit).map((item, idx) =>
                            item.type === 'series' ? (
                                <SeriesUpcomingCard
                                    key={item.matches[0].game_id}
                                    matches={item.matches}
                                    onClick={openMatch}
                                    onViewSeries={openSeries}
                                />
                            ) : item.type === 'tournament' ? (
                                <UpcomingCard
                                    key={item.match.game_id}
                                    match={item.match}
                                    onClick={openMatch}
                                    showTournamentButton={true}
                                    onViewTournament={openTournament}
                                />
                            ) : (
                                <UpcomingCard
                                    key={item.match.game_id}
                                    match={item.match}
                                    onClick={openMatch}
                                />
                            )
                        )}
                        {upcomingLimit < processedUpcoming.length && (
                            <button
                                className="view-more-card"
                                onClick={() => setUpcomingLimit(prev => prev + 10)}
                            >
                                <span className="view-more-icon">+</span>
                                <span className="view-more-text">View More</span>
                                <span className="view-more-count">{processedUpcoming.length - upcomingLimit} more</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="empty-state">No upcoming matches</div>
                )}
            </section>

            {/* Results Section */}
            {processedCompleted.length > 0 && (
                <section className="section">
                    <div className="section-header">
                        <h3 className="section-title">Results</h3>
                        <div className="section-line"></div>
                    </div>
                    <div className="horizontal-scroll" ref={resultsScrollRef}>
                        {processedCompleted.slice(0, resultsLimit).map((item, idx) => (
                            <CompletedCard
                                key={item.match.game_id + '-' + idx}
                                match={item.match}
                                onClick={openMatch}
                                showSeriesButton={item.type === 'series'}
                                onViewSeries={(sid) => openSeries(sid, completedSeriesGroups[sid] || [])}
                                showTournamentButton={item.type === 'tournament'}
                                onViewTournament={openTournament}
                            />
                        ))}
                        {resultsLimit < processedCompleted.length && (
                            <button
                                className="view-more-card"
                                onClick={loadMoreResults}
                            >
                                <span className="view-more-icon">+</span>
                                <span className="view-more-text">View More</span>
                                <span className="view-more-count">{processedCompleted.length - resultsLimit} more</span>
                            </button>
                        )}
                    </div>
                </section>
            )}
        </>
    );
}
