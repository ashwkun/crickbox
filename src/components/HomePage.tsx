import React, { useEffect, useState, useRef, useMemo } from 'react';
import useCricketData from '../utils/useCricketData';
import MatchCard from './MatchCard';
import { LuMoonStar, LuCalendarClock } from "react-icons/lu";
import CompletedCard from './CompletedCard';
import UpcomingCard from './UpcomingCard';
import SeriesHub from './SeriesHub';
import TournamentHub from './TournamentHub';
import FilterChips from './FilterChips';
import TimeFilter, { TimeFilterValue } from './upcoming/TimeFilter';
import { filterByTime, isToday, isTomorrow, isThisWeek } from '../utils/upcomingUtils';

import SkeletonMatchCard from './SkeletonMatchCard';
import { Match, Scorecard } from '../types';
import { sortByPriority, generateChips, generateUpcomingChips, filterByChip } from '../utils/matchPriority';

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
    onOpenUpcomingList: () => void;
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
    onCloseTournament,
    onOpenUpcomingList
}: HomePageProps): React.ReactElement {
    const [upcomingLimit, setUpcomingLimit] = useState(10);
    const [resultsLimit, setResultsLimit] = useState(8);
    const [activeLiveIndex, setActiveLiveIndex] = useState(0);
    const [activeLiveChip, setActiveLiveChip] = useState('all');
    const [upcomingTimeFilter, setUpcomingTimeFilter] = useState<TimeFilterValue>('all');
    const [activeUpcomingChip, setActiveUpcomingChip] = useState('all');
    const [hasInitializedTimeFilter, setHasInitializedTimeFilter] = useState(false);
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

    // Time-filtered upcoming matches (for cards only)
    const timeFilteredMatches = useMemo(() =>
        filterByTime(upcomingMatches, upcomingTimeFilter),
        [upcomingMatches, upcomingTimeFilter]
    );

    // Generate chips for upcoming section (based on ALL matches - consistent chips)
    const upcomingChips = useMemo(() => generateUpcomingChips(upcomingMatches), [upcomingMatches]);

    // Smart default for time filter: Today > Tomorrow > Week > All
    useEffect(() => {
        if (hasInitializedTimeFilter || upcomingMatches.length === 0) return;

        const hasToday = upcomingMatches.some(m => isToday(new Date(m.start_date)));
        const hasTomorrow = upcomingMatches.some(m => isTomorrow(new Date(m.start_date)));
        const hasThisWeek = upcomingMatches.some(m => isThisWeek(new Date(m.start_date)));

        if (hasToday) {
            setUpcomingTimeFilter('today');
        } else if (hasTomorrow) {
            setUpcomingTimeFilter('tomorrow');
        } else if (hasThisWeek) {
            setUpcomingTimeFilter('week');
        }
        // else keep 'all'

        setHasInitializedTimeFilter(true);
    }, [upcomingMatches, hasInitializedTimeFilter]);

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

    // Apply time AND category filters to processed upcoming
    const filteredUpcoming = useMemo(() => {
        let result = processedUpcoming;

        // Apply time filter
        if (upcomingTimeFilter !== 'all') {
            result = result.filter(item => {
                if (item.type === 'series') {
                    const seriesItem = item as ProcessedSeriesItem;
                    const timeFiltered = filterByTime(seriesItem.matches, upcomingTimeFilter);
                    return timeFiltered.length > 0;
                }
                const matchItem = item as ProcessedMatchItem;
                const timeFiltered = filterByTime([matchItem.match], upcomingTimeFilter);
                return timeFiltered.length > 0;
            });
        }

        // Apply category filter
        if (activeUpcomingChip !== 'all') {
            result = result.filter(item => {
                if (item.type === 'series') {
                    const seriesItem = item as ProcessedSeriesItem;
                    // Check if any match in series matches the chip
                    return seriesItem.matches.some(m => filterByChip([m], activeUpcomingChip).length > 0);
                }
                const matchItem = item as ProcessedMatchItem;
                return filterByChip([matchItem.match], activeUpcomingChip).length > 0;
            });
        }

        return result;
    }, [processedUpcoming, upcomingTimeFilter, activeUpcomingChip]);

    // Smart fallback: if category filter yields no results, expand time filter
    useEffect(() => {
        if (filteredUpcoming.length === 0 &&
            activeUpcomingChip !== 'all' &&
            upcomingTimeFilter !== 'all') {
            // Expand to all dates to find results for this category
            setUpcomingTimeFilter('all');
        }
    }, [filteredUpcoming.length, activeUpcomingChip, upcomingTimeFilter]);

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
                        padding: '24px 20px',
                        background: 'linear-gradient(180deg, rgba(15,23,42,0.6) 0%, rgba(30,41,59,0.4) 100%)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        margin: '0 16px',
                        textAlign: 'center',
                        marginTop: 10,
                        position: 'relative',
                        overflow: 'hidden',
                        backdropFilter: 'blur(12px)',
                        minHeight: '160px',
                    }}>
                        {/* Sleepy Animation Wrapper */}
                        <div style={{ position: 'relative', marginBottom: 16 }}>
                            {/* Rocking Moon */}
                            <div style={{ animation: 'sleepyRock 4s ease-in-out infinite transform-origin-center' }}>
                                <LuMoonStar size={56} color="rgba(148, 163, 184, 0.6)" />
                            </div>

                            {/* Floating Zzzs */}
                            <span style={{
                                position: 'absolute', top: -5, right: -12,
                                color: 'rgba(255,255,255,0.7)', fontWeight: 800, fontSize: '16px',
                                animation: 'floatUp 3s ease-in infinite'
                            }}>Z</span>
                            <span style={{
                                position: 'absolute', top: -20, right: -25,
                                color: 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: '12px',
                                animation: 'floatUp 3s ease-in infinite', animationDelay: '1s'
                            }}>z</span>
                            <span style={{
                                position: 'absolute', top: -40, right: -15,
                                color: 'rgba(255,255,255,0.3)', fontWeight: 800, fontSize: '10px',
                                animation: 'floatUp 3s ease-in infinite', animationDelay: '2s'
                            }}>z</span>
                        </div>

                        <h3 style={{
                            margin: '8px 0 6px',
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#f1f5f9',
                            letterSpacing: '-0.5px'
                        }}>
                            Cricket is sleeping
                        </h3>
                        <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: '#94a3b8',
                            lineHeight: '1.5',
                            maxWidth: '260px'
                        }}>
                            Nothing happening right now.<br />The pitch is bored.
                        </p>

                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 16,
                            background: 'rgba(255,255,255,0.05)',
                            padding: '8px 16px',
                            borderRadius: 100,
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <LuCalendarClock size={14} color="#94a3b8" />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>Check upcoming fixtures</span>
                        </div>
                    </div>
                )}
            </section>

            {/* Upcoming Section */}
            <section className="section">
                {/* Header Row: .NEXT + TimeFilter (fixed, no scroll) */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '0 20px 8px 16px',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    {/* .NEXT Branding */}
                    <span style={{
                        fontFamily: '"BBH Bartle", sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        background: 'linear-gradient(90deg, #6366f1 0%, #a5b4fc 50%, #6366f1 100%)',
                        backgroundSize: '200% 100%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'liveShimmer 2s ease-in-out infinite alternate',
                        flexShrink: 0,
                    }}>
                        .NEXT
                    </span>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Time Filter Dropdown (right side) */}
                    <TimeFilter
                        value={upcomingTimeFilter}
                        onChange={setUpcomingTimeFilter}
                    />
                </div>

                {/* Chips Row: horizontally scrollable */}
                <div style={{
                    display: 'flex',
                    gap: 8,
                    padding: '0 20px 12px 16px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                }}>
                    {upcomingChips.slice(0, 8).map(chip => (
                        <div
                            key={chip.id}
                            onClick={() => setActiveUpcomingChip(chip.id)}
                            style={{
                                padding: '5px 10px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: chip.id === activeUpcomingChip ? 600 : 500,
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                flexShrink: 0,
                                transition: 'all 0.2s ease',
                                background: chip.id === activeUpcomingChip
                                    ? 'rgba(99, 102, 241, 0.25)'
                                    : 'rgba(20, 20, 20, 0.5)',
                                border: chip.id === activeUpcomingChip
                                    ? '1px solid rgba(99, 102, 241, 0.5)'
                                    : '1px solid rgba(255, 255, 255, 0.08)',
                                color: chip.id === activeUpcomingChip ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                            }}
                        >
                            {chip.label}
                        </div>
                    ))}
                </div>
                {loading && matches.length === 0 ? (
                    <div className="horizontal-scroll">
                        <SkeletonMatchCard />
                        <SkeletonMatchCard />
                    </div>
                ) : filteredUpcoming.length > 0 ? (
                    <div className="horizontal-scroll" ref={upcomingScrollRef}>
                        {filteredUpcoming.slice(0, 8).map((item, idx) =>
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

                        {/* Full Calendar always visible */}
                        <button
                            className="view-more-card"
                            onClick={onOpenUpcomingList}
                        >
                            <span className="view-more-icon">+</span>
                            <span className="view-more-text">Full Calendar</span>
                            <span className="view-more-count">{upcomingMatches.length} total</span>
                        </button>
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
