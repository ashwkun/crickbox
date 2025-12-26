import React, { useEffect, useState, useRef, useMemo } from 'react';
import useCricketData from '../utils/useCricketData';
import MatchCard from './MatchCard';
import CompletedCard from './CompletedCard';
import UpcomingCard from './UpcomingCard';
import SeriesUpcomingCard from './ExpandableUpcomingCard';
import SeriesHub from './SeriesHub';
import TournamentHub from './TournamentHub';

import SkeletonMatchCard from './SkeletonMatchCard';
import { Match, Scorecard } from '../types';

// Types for processed items
interface ProcessedSeriesItem {
    type: 'series';
    matches: Match[];
    firstDate: Date;
}

interface ProcessedMatchItem {
    type: 'tournament' | 'single';
    match: Match;
    seriesId?: string;
    firstDate: Date;
}

interface ProcessedCompletedItem {
    type: 'series' | 'tournament' | 'single';
    match: Match;
    seriesId?: string;
    latestDate: Date;
}

interface SelectedSeries {
    seriesId: string;
    seriesName: string;
    matches: Match[];
}

interface SelectedTournament {
    seriesId: string;
    tournamentName: string;
    matches: Match[];
}

type ProcessedUpcomingItem = ProcessedSeriesItem | ProcessedMatchItem;

// Filter for international men's matches + BBL
const isInternationalMens = (match: Match): boolean => {
    const teams = match.participants?.map(p => p.short_name || '').join(' ').toUpperCase() || '';
    const leagueCode = (match as any).league_code?.toLowerCase() || '';
    const seriesName = match.series_name?.toLowerCase() || '';

    // Exclude women's and youth matches
    if (teams.includes('-W') || leagueCode.includes('women')) return false;
    if (teams.includes('-U19') || teams.includes('-U') || leagueCode.includes('youth') || leagueCode.includes('under')) return false;

    // Allow BBL (Big Bash League)
    if (seriesName.includes('big bash') || seriesName.includes('bbl')) return true;

    // Filter out other domestic leagues
    if (leagueCode.includes('domestic') || leagueCode.includes('premier') || leagueCode.includes('trophy')) {
        if (!leagueCode.includes('hazare')) return false;
    }

    if (leagueCode.includes('icc')) return true;

    const format = match.event_format?.toLowerCase() || '';
    if (format === 'test' || format === 'odi' || format === 't20') return true;

    return true;
};

// Check if series is bilateral (2 unique teams)
const isBilateral = (matches: Match[]): boolean => {
    const uniqueTeams = new Set<string>();
    matches.forEach(m => {
        m.participants?.forEach(p => uniqueTeams.add(p.short_name));
    });
    return uniqueTeams.size === 2;
};

// Group matches by series_id
const groupBySeries = (matches: Match[]): Record<string, Match[]> => {
    const groups: Record<string, Match[]> = {};
    matches.forEach(m => {
        const sid = m.series_id || 'unknown';
        if (!groups[sid]) {
            groups[sid] = [];
        }
        groups[sid].push(m);
    });
    return groups;
};

interface HomePageProps {
    matches: Match[];
    loading: boolean;
    fetchExtendedResults: (chunks?: number) => Promise<Match[]>;
    onSelectMatch: (match: Match) => void;
    // New props for lifted state
    selectedSeries: SelectedSeries | null;
    selectedTournament: SelectedTournament | null;
    onOpenSeries: (seriesId: string, seriesMatches?: Match[]) => void;
    onCloseSeries: () => void;
    onOpenTournament: (seriesId: string) => void;
    onCloseTournament: () => void;
}

export default function HomePage({
    matches,
    loading,
    fetchExtendedResults,
    onSelectMatch,
    selectedSeries,
    selectedTournament,
    onOpenSeries,
    onCloseSeries,
    onOpenTournament,
    onCloseTournament
}: HomePageProps): React.ReactElement {
    const [upcomingLimit, setUpcomingLimit] = useState(10);
    const [resultsLimit, setResultsLimit] = useState(8);
    const resultsScrollRef = useRef<HTMLDivElement>(null);

    const loadMoreResults = () => {
        const currentScrollLeft = resultsScrollRef.current?.scrollLeft || 0;
        setResultsLimit(prev => prev + 8);
        fetchExtendedResults(1); // Load next chunk
        setTimeout(() => {
            if (resultsScrollRef.current) {
                resultsScrollRef.current.scrollLeft = currentScrollLeft;
            }
        }, 50);
    };

    // Navigation logic lifted to App.tsx

    const openMatch = (match: Match) => {
        onSelectMatch(match);
    };

    // Forwarding to props
    const openSeries = (seriesId: string, seriesMatches: Match[]) => {
        onOpenSeries(seriesId, seriesMatches);
    };

    const closeSeries = () => {
        onCloseSeries();
    };

    const openTournament = (seriesId: string) => {
        onOpenTournament(seriesId);
    };

    const closeTournament = () => {
        onCloseTournament();
    };

    // Memoized computations to prevent recalculation on every render
    const liveMatches = useMemo(() =>
        matches
            .filter(m => m.event_state === 'L')
            .filter(isInternationalMens)
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()),
        [matches]
    );

    const upcomingMatches = useMemo(() =>
        matches
            .filter(m => m.event_state === 'U')
            .filter(m => !m.event_status?.toLowerCase().includes('cancel') && !m.event_status?.toLowerCase().includes('abandon'))
            .filter(isInternationalMens)
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()),
        [matches]
    );

    const completedMatches = useMemo(() =>
        matches
            .filter(m => {
                if (m.event_state === 'L') return false;
                if (m.event_state === 'U') {
                    const s = (m.event_status || '') + (m.event_sub_status || '');
                    return s.toLowerCase().includes('cancel') || s.toLowerCase().includes('abandon');
                }
                return true;
            })
            .filter(isInternationalMens)
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
            .slice(0, 50),
        [matches]
    );

    const seriesGroups = useMemo(() => groupBySeries(upcomingMatches), [upcomingMatches]);
    const completedSeriesGroups = useMemo(() => groupBySeries(completedMatches), [completedMatches]);

    // Process completed matches
    const processedCompleted = useMemo(() => {
        const result: ProcessedCompletedItem[] = [];
        const processedSeriesIds = new Set<string>();

        completedMatches.forEach(match => {
            const sid = match.series_id || 'unknown';
            const seriesMatches = completedSeriesGroups[sid] || [match];
            const isBilateralMatch = isBilateral(seriesMatches);
            const isPartOfSeries = sid && sid !== 'unknown';

            if (isBilateralMatch && isPartOfSeries) {
                if (!processedSeriesIds.has(sid)) {
                    result.push({
                        type: 'series',
                        match,
                        seriesId: sid,
                        latestDate: new Date(match.start_date)
                    });
                    processedSeriesIds.add(sid);
                }
            } else if (!isBilateralMatch && seriesMatches.length > 1) {
                result.push({
                    type: 'tournament',
                    match,
                    seriesId: sid,
                    latestDate: new Date(match.start_date)
                });
            } else {
                result.push({
                    type: 'single',
                    match,
                    latestDate: new Date(match.start_date)
                });
            }
        });

        return result.sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
    }, [completedMatches, completedSeriesGroups]);

    // Process upcoming matches
    const processedUpcoming = useMemo(() => {
        const result: ProcessedUpcomingItem[] = [];
        const processedSeriesIds = new Set<string>();

        upcomingMatches.forEach(match => {
            const sid = match.series_id || 'unknown';
            if (processedSeriesIds.has(sid)) return;

            const seriesMatches = seriesGroups[sid] || [match];

            if (seriesMatches.length > 1 && isBilateral(seriesMatches)) {
                if (!processedSeriesIds.has(sid)) {
                    result.push({
                        type: 'series',
                        matches: seriesMatches.sort((a, b) =>
                            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
                        ),
                        firstDate: new Date(seriesMatches[0].start_date)
                    });
                    processedSeriesIds.add(sid);
                }
            } else if (seriesMatches.length > 1) {
                result.push({
                    type: 'tournament',
                    match,
                    seriesId: sid,
                    firstDate: new Date(match.start_date)
                });
            } else {
                result.push({
                    type: 'single',
                    match,
                    firstDate: new Date(match.start_date)
                });
            }
        });

        return result.sort((a, b) => a.firstDate.getTime() - b.firstDate.getTime());
    }, [upcomingMatches, seriesGroups]);

    // Tournament Hub View
    if (selectedTournament) {
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
    if (selectedSeries) {
        return (
            <SeriesHub
                seriesName={selectedSeries.seriesName}
                matches={selectedSeries.matches}
                onBack={closeSeries}
                onMatchClick={openMatch}
            />
        );
    }

    const heroMatch = liveMatches[0];

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
                ) : liveMatches.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {liveMatches.map(match => (
                            <MatchCard key={match.game_id} match={match} onClick={openMatch} isHero={true} />
                        ))}
                    </div>
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
                                    key={(item as ProcessedSeriesItem).matches[0].game_id}
                                    matches={(item as ProcessedSeriesItem).matches}
                                    onClick={openMatch}
                                    onViewSeries={openSeries}
                                />
                            ) : item.type === 'tournament' ? (
                                <UpcomingCard
                                    key={(item as ProcessedMatchItem).match.game_id}
                                    match={(item as ProcessedMatchItem).match}
                                    onClick={openMatch}
                                    showTournamentButton={true}
                                    onViewTournament={openTournament}
                                />
                            ) : (
                                <UpcomingCard
                                    key={(item as ProcessedMatchItem).match.game_id}
                                    match={(item as ProcessedMatchItem).match}
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
            <section className="section">
                <div className="section-header">
                    <h3 className="section-title">Results</h3>
                    <div className="section-line"></div>
                </div>
                {loading && matches.length === 0 ? (
                    <div className="horizontal-scroll">
                        <SkeletonMatchCard />
                        <SkeletonMatchCard />
                    </div>
                ) : processedCompleted.length > 0 ? (
                    <div className="horizontal-scroll" ref={resultsScrollRef}>
                        {processedCompleted.slice(0, resultsLimit).map((item, idx) => (
                            <CompletedCard
                                key={item.match.game_id + '-' + idx}
                                match={item.match}
                                onClick={openMatch}
                                showSeriesButton={item.type === 'series'}
                                onViewSeries={(sid: string) => openSeries(sid, completedSeriesGroups[sid] || [])}
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
                ) : (
                    <div className="empty-state">No recent results</div>
                )}
            </section>
        </>
    );
}
