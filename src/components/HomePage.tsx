import React, { useEffect, useState, useRef, useMemo } from 'react';
import useCricketData from '../utils/useCricketData';
import MatchCard from './MatchCard';
import { LuMoonStar, LuCalendarClock } from "react-icons/lu";
import CompletedCard from './CompletedCard';
import UpcomingCard from './UpcomingCard';
import SeriesHub from './SeriesHub';
import TournamentHub from './TournamentHub';
import FilterChips from './FilterChips';

import SkeletonMatchCard from './SkeletonMatchCard';
import { Match, Scorecard } from '../types';
import { sortByPriority, generateChips, filterByChip } from '../utils/matchPriority';

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
// Filter for international men's matches + BBL
const isInternationalMens = (match: Match): boolean => {
    // Disable filtering - let all games pass through as per user request
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
    const [activeLiveIndex, setActiveLiveIndex] = useState(0);
    const [activeLiveChip, setActiveLiveChip] = useState('all');
    const resultsScrollRef = useRef<HTMLDivElement>(null);
    const upcomingScrollRef = useRef<HTMLDivElement>(null);
    const liveScrollRef = useRef<HTMLDivElement>(null);

    // Handle Live scroll to track active index for dot indicators
    const handleLiveScroll = () => {
        if (!liveScrollRef.current) return;
        const container = liveScrollRef.current;
        const cardWidth = container.firstElementChild?.clientWidth || 300;
        const gap = 12; // matches CSS gap
        const index = Math.round(container.scrollLeft / (cardWidth + gap));
        setActiveLiveIndex(Math.max(0, index));
    };

    const loadMoreUpcoming = () => {
        const currentScrollLeft = upcomingScrollRef.current?.scrollLeft || 0;
        setUpcomingLimit(prev => prev + 10);
        // Preserve scroll position so View More button stays in place
        setTimeout(() => {
            if (upcomingScrollRef.current) {
                upcomingScrollRef.current.scrollLeft = currentScrollLeft;
            }
        }, 50);
    };

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
    // Forwarding to props
    const openSeries = (seriesId: string, seriesMatches?: Match[]) => {
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

    // Memoized computations - purely API-driven by event_state
    const liveMatchesRaw = useMemo(() =>
        matches
            .filter(m => m.event_state === 'L') // Live Matches
            .filter(isInternationalMens),
        [matches]
    );

    // Apply priority sorting to live matches
    const liveMatchesSorted = useMemo(() => sortByPriority(liveMatchesRaw), [liveMatchesRaw]);

    // Generate chips for live section
    const liveChips = useMemo(() => generateChips(liveMatchesSorted), [liveMatchesSorted]);

    // Filter by active chip
    const liveMatches = useMemo(() =>
        filterByChip(liveMatchesSorted, activeLiveChip),
        [liveMatchesSorted, activeLiveChip]
    );

    const upcomingMatches = useMemo(() =>
        matches
            .filter(m => m.event_state === 'U') // Upcoming Matches
            .filter(isInternationalMens)
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()),
        [matches]
    );

    const completedMatches = useMemo(() =>
        matches
            .filter(m => m.event_state !== 'L' && m.event_state !== 'U')
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
                    seriesId: sid !== 'unknown' ? sid : undefined,
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
            <section className="section" style={{ paddingTop: 8 }}>

                {/* Filter Chips */}
                <FilterChips
                    chips={liveChips}
                    activeChip={activeLiveChip}
                    onChipClick={(chipId) => {
                        setActiveLiveChip(chipId);
                        setActiveLiveIndex(0); // Reset scroll position
                        if (liveScrollRef.current) {
                            liveScrollRef.current.scrollLeft = 0;
                        }
                    }}
                />

                {loading && matches.length === 0 ? (
                    <div className="horizontal-scroll">
                        <SkeletonMatchCard />
                        <SkeletonMatchCard />
                    </div>
                ) : liveMatches.length > 0 ? (
                    <>
                        <div className="horizontal-scroll" ref={liveScrollRef} onScroll={handleLiveScroll}>
                            {liveMatches.map(match => (
                                <MatchCard
                                    key={match.game_id}
                                    match={match}
                                    onClick={openMatch}
                                    isHero={true}
                                    onSeriesClick={(seriesId) => openSeries(seriesId, undefined)}
                                />
                            ))}
                        </div>
                        {/* Sliding Dot Indicators - max 10 visible, window shifts */}
                        {liveMatches.length > 1 && (() => {
                            const total = liveMatches.length;
                            const maxVisible = Math.min(10, total);

                            // Calculate sliding window: keep active dot roughly centered
                            let startIndex = Math.max(0, activeLiveIndex - Math.floor(maxVisible / 2));
                            if (startIndex + maxVisible > total) {
                                startIndex = Math.max(0, total - maxVisible);
                            }

                            return (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 10 }}>
                                    {Array.from({ length: maxVisible }).map((_, idx) => {
                                        const actualIndex = startIndex + idx;
                                        const isActive = actualIndex === activeLiveIndex;
                                        // Edge dots are smaller (fade effect)
                                        const isEdge = idx === 0 || idx === maxVisible - 1;
                                        const baseSize = isEdge && total > maxVisible ? 4 : 6;

                                        return (
                                            <div
                                                key={actualIndex}
                                                style={{
                                                    width: isActive ? 16 : baseSize,
                                                    height: baseSize,
                                                    borderRadius: baseSize / 2,
                                                    background: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                                                    transition: 'all 0.2s ease',
                                                    flexShrink: 0
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '30px 20px',
                        background: 'linear-gradient(135deg, rgba(20,20,20,0.6) 0%, rgba(30,30,30,0.4) 100%)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        margin: '0 16px',
                        textAlign: 'center',
                        marginTop: 10,
                        position: 'relative',
                        overflow: 'hidden',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    }}>
                        {/* Background Effect */}
                        <div style={{
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '200%',
                            height: '200%',
                            background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
                            pointerEvents: 'none',
                        }} />

                        {/* ... inside the component render */}
                        <LuMoonStar size={42} color="rgba(255,255,255,0.4)" style={{ marginBottom: 12 }} />

                        <h3 style={{
                            margin: '12px 0 4px',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.9)',
                            letterSpacing: '0.5px'
                        }}>
                            Stumps
                        </h3>
                        <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.5)',
                            lineHeight: '1.4'
                        }}>
                            The pitch is quiet. <br />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                <LuCalendarClock size={12} /> Check upcoming fixtures
                            </span>
                        </p>
                    </div>
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
                    <div className="horizontal-scroll" ref={upcomingScrollRef}>
                        {processedUpcoming.slice(0, upcomingLimit).map((item, idx) =>
                            item.type === 'series' ? (
                                <UpcomingCard
                                    key={(item as ProcessedSeriesItem).matches[0].game_id}
                                    match={(item as ProcessedSeriesItem).matches[0]}
                                    matches={(item as ProcessedSeriesItem).matches}
                                    onClick={openMatch}
                                    showSeriesButton={true}
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
                                    showSeriesButton={(item as ProcessedMatchItem).seriesId !== undefined}
                                    onViewSeries={(item as ProcessedMatchItem).seriesId ? openSeries : undefined}
                                />
                            )
                        )}
                        {upcomingLimit < processedUpcoming.length && (
                            <button
                                className="view-more-card"
                                onClick={loadMoreUpcoming}
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
