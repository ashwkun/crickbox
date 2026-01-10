import React, { useEffect, useState, useRef, useMemo } from 'react';
import useCricketData from '../utils/useCricketData';
import MatchCard from './MatchCard';
import { LuMoonStar, LuCalendarClock, LuCalendarDays } from "react-icons/lu";
import CompletedCard from './CompletedCard';
import FeatSection from './FeatSection';
import UpcomingCard from './UpcomingCard';
import FilterChips from './FilterChips';
import TimeFilter, { TimeFilterValue } from './upcoming/TimeFilter';
import PastFilter from './upcoming/PastFilter';
import { wisdenLogo } from '../assets/wisden_logo_base64';
import { filterByTime, isToday, isTomorrow, isThisWeek } from '../utils/upcomingUtils';
import { filterByPastTime, isYesterday, wasLastWeek, PastTimeFilterValue } from '../utils/pastUtils';

import SkeletonMatchCard from './SkeletonMatchCard';
import { Match, Scorecard } from '../types';
import { sortByPriority, generateChips, generateUpcomingChips, filterByChip, filterFeatured24hr } from '../utils/matchPriority';

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
    onSelectMatch: (match: Match) => void;
    // New navigation callbacks
    onOpenSeries: (seriesId: string, seriesMatches?: Match[]) => void;
    onCloseSeries: () => void;
    onOpenTournament: (seriesId: string) => void;
    onCloseTournament: () => void;
    onOpenTournament: (seriesId: string) => void;
    onCloseTournament: () => void;
    onOpenUpcomingList: () => void;
    onOpenCompletedList: () => void;
    isVisible?: boolean;
}

export default function HomePage({
    matches,
    loading,
    fetchExtendedResults,
    onSelectMatch,
    onOpenSeries,
    onCloseSeries,
    onOpenTournament,
    onCloseTournament,
    onCloseTournament,
    onOpenUpcomingList,
    onOpenCompletedList,
    isVisible = true
}: HomePageProps): React.ReactElement {
    const [upcomingLimit, setUpcomingLimit] = useState(10);
    const [resultsLimit, setResultsLimit] = useState(8);
    const [activeLiveIndex, setActiveLiveIndex] = useState(0);
    const [activeLiveChip, setActiveLiveChip] = useState('all');
    const [upcomingTimeFilter, setUpcomingTimeFilter] = useState<TimeFilterValue>('all');
    const [activeUpcomingChip, setActiveUpcomingChip] = useState('featured');
    const [lastChangedFilter, setLastChangedFilter] = useState<'time' | 'type' | null>(null);
    const [hasInitializedTimeFilter, setHasInitializedTimeFilter] = useState(false);

    // Results (.PAST) section filter states
    const [resultsTimeFilter, setResultsTimeFilter] = useState<PastTimeFilterValue>('all');
    const [activeResultsChip, setActiveResultsChip] = useState('featured');
    const [lastChangedResultsFilter, setLastChangedResultsFilter] = useState<'time' | 'type' | null>(null);
    const [hasInitializedResultsTimeFilter, setHasInitializedResultsTimeFilter] = useState(false);

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
        // Now opens full page instead of expanding inline
        onOpenCompletedList();
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
            .sort((a, b) => {
                const dateA = a.end_date ? new Date(a.end_date).getTime() : new Date(a.start_date).getTime();
                const dateB = b.end_date ? new Date(b.end_date).getTime() : new Date(b.start_date).getTime();
                return dateB - dateA;
            .sort((a, b) => {
                    const dateA = a.end_date ? new Date(a.end_date).getTime() : new Date(a.start_date).getTime();
                    const dateB = b.end_date ? new Date(b.end_date).getTime() : new Date(b.start_date).getTime();
                    return dateB - dateA;
                })
            // Only slice for the homepage widget view
            // The full list is handled by CompletedListPage
            .slice(0, 15),
        [matches]
    );

    // Featured matches for .FEAT section (24hr window)
    const featuredMatches = useMemo(() =>
        filterFeatured24hr(matches),
        [matches]
    );

    const seriesGroups = useMemo(() => groupBySeries(upcomingMatches), [upcomingMatches]);
    const completedSeriesGroups = useMemo(() => groupBySeries(completedMatches), [completedMatches]);

    // Process completed matches
    const processedCompleted = useMemo(() => {
        const result: ProcessedCompletedItem[] = [];
        const processedSeriesIds = new Set<string>();

        // Pre-sort completed matches by end_date (or start_date) descending
        const sortedCompleted = [...completedMatches].sort((a, b) => {
            const dateA = a.end_date ? new Date(a.end_date).getTime() : new Date(a.start_date).getTime();
            const dateB = b.end_date ? new Date(b.end_date).getTime() : new Date(b.start_date).getTime();
            return dateB - dateA;
        });

        sortedCompleted.forEach(match => {
            const sid = match.series_id || 'unknown';
            const seriesMatches = completedSeriesGroups[sid] || [match];
            const isBilateralMatch = isBilateral(seriesMatches);
            const isPartOfSeries = sid && sid !== 'unknown';

            // Determination of "Date" for this item (use end_date for tests/completed)
            const itemDate = match.end_date ? new Date(match.end_date) : new Date(match.start_date);

            if (isBilateralMatch && isPartOfSeries) {
                if (!processedSeriesIds.has(sid)) {
                    // Find the latest match in this series that is completed
                    // (Should be 'match' because we sorted sortedCompleted, but let's be safe)
                    const latestSeriesMatch = seriesMatches.reduce((prev, current) => {
                        const prevDate = prev.end_date ? new Date(prev.end_date) : new Date(prev.start_date);
                        const currDate = current.end_date ? new Date(current.end_date) : new Date(current.start_date);
                        return (prevDate > currDate) ? prev : current;
                    });

                    result.push({
                        type: 'series',
                        match: latestSeriesMatch,
                        seriesId: sid,
                        latestDate: latestSeriesMatch.end_date ? new Date(latestSeriesMatch.end_date) : new Date(latestSeriesMatch.start_date)
                    });
                    processedSeriesIds.add(sid);
                }
            } else if (!isBilateralMatch && seriesMatches.length > 1) {
                result.push({
                    type: 'tournament',
                    match,
                    seriesId: sid,
                    latestDate: itemDate
                });
            } else {
                result.push({
                    type: 'single',
                    match,
                    latestDate: itemDate
                });
            }
        });

        return result.sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
    }, [completedMatches, completedSeriesGroups]);

    // Generate chips for results section (based on ALL completed matches)
    const resultsChips = useMemo(() => generateUpcomingChips(completedMatches), [completedMatches]);

    // Smart default for results time filter: Today > Yesterday > Week > All
    useEffect(() => {
        if (hasInitializedResultsTimeFilter || completedMatches.length === 0) return;

        const checkDate = (m: Match, checkFn: (d: Date) => boolean) => {
            if (m.end_date && (m.event_format?.includes('TEST') || m.event_format?.includes('FC'))) {
                return checkFn(new Date(m.end_date));
            }
            return checkFn(new Date(m.start_date));
        };

        const hasToday = completedMatches.some(m => checkDate(m, isToday));
        const hasYesterday = completedMatches.some(m => checkDate(m, isYesterday));
        const hasLastWeek = completedMatches.some(m => checkDate(m, wasLastWeek));

        if (hasToday) {
            setResultsTimeFilter('today');
        } else if (hasYesterday) {
            setResultsTimeFilter('yesterday');
        } else if (hasLastWeek) {
            setResultsTimeFilter('week');
        }
        // else keep 'all'

        setHasInitializedResultsTimeFilter(true);
    }, [completedMatches, hasInitializedResultsTimeFilter]);

    // Apply time AND category filters to processed completed
    const filteredCompleted = useMemo(() => {
        let result = processedCompleted;

        // Apply time filter
        if (resultsTimeFilter !== 'all') {
            result = result.filter(item => {
                const timeFiltered = filterByPastTime([item.match], resultsTimeFilter);
                return timeFiltered.length > 0;
            });
        }

        // Apply category filter
        if (activeResultsChip !== 'all') {
            result = result.filter(item => {
                return filterByChip([item.match], activeResultsChip).length > 0;
            });
        }

        return result;
    }, [processedCompleted, resultsTimeFilter, activeResultsChip]);

    // Smart bidirectional fallback for results
    useEffect(() => {
        if (filteredCompleted.length === 0 && lastChangedResultsFilter) {
            if (lastChangedResultsFilter === 'time' && activeResultsChip !== 'all') {
                setActiveResultsChip('all');
            } else if (lastChangedResultsFilter === 'type' && resultsTimeFilter !== 'all') {
                setResultsTimeFilter('all');
            }
            setLastChangedResultsFilter(null);
        }
    }, [filteredCompleted.length, lastChangedResultsFilter, activeResultsChip, resultsTimeFilter]);

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

    // Smart bidirectional fallback:
    // - If user changed TIME filter and it results in empty → reset TYPE to 'all'
    // - If user changed TYPE filter and it results in empty → reset TIME to 'all'
    useEffect(() => {
        if (filteredUpcoming.length === 0 && lastChangedFilter) {
            if (lastChangedFilter === 'time' && activeUpcomingChip !== 'all') {
                // User changed time, reset category
                setActiveUpcomingChip('all');
            } else if (lastChangedFilter === 'type' && upcomingTimeFilter !== 'all') {
                // User changed type, reset time
                setUpcomingTimeFilter('all');
            }
            // Clear the flag after handling
            setLastChangedFilter(null);
        }
    }, [filteredUpcoming.length, lastChangedFilter, activeUpcomingChip, upcomingTimeFilter]);

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

                        <div
                            onClick={onOpenUpcomingList}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                marginTop: 16,
                                background: 'rgba(255,255,255,0.05)',
                                padding: '8px 16px',
                                borderRadius: 100,
                                border: '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer',
                            }}>
                            <LuCalendarClock size={14} color="#94a3b8" />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>See what's </span>
                            <span style={{
                                fontFamily: '"BBH Bartle", sans-serif',
                                fontSize: '12px',
                                fontWeight: 700,
                                background: 'linear-gradient(90deg, #818cf8 0%, #a5b4fc 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>.NEXT</span>
                        </div>
                    </div>
                )}
            </section>

            {/* Featured Section (.FEAT) - Live + Upcoming 24hr + Completed 24hr */}
            <FeatSection
                matches={featuredMatches}
                onMatchClick={openMatch}
            />

            {/* Upcoming Section - Gamer Design Pivot */}
            <section className="section">
                {/* Header Row: .NEXT + Time Chips with collapsible branding */}
                <div style={{
                    padding: '0 20px 8px 16px',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    <TimeFilter
                        value={upcomingTimeFilter}
                        onChange={(v) => {
                            setLastChangedFilter('time');
                            setUpcomingTimeFilter(v);
                        }}
                        allowedFilters={['all', 'today', 'tomorrow', 'week']}
                        onNextClick={onOpenUpcomingList}
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
                    {upcomingChips.map(chip => (
                        <div
                            key={chip.id}
                            onClick={() => {
                                setLastChangedFilter('type');
                                setActiveUpcomingChip(chip.id);
                            }}
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
                            {typeof chip.label === 'string' ? chip.label : String(chip.label || '')}
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
                            item.type === 'series' && (item as ProcessedSeriesItem).matches?.[0] ? (
                                <UpcomingCard
                                    key={(item as ProcessedSeriesItem).matches[0].game_id}
                                    match={(item as ProcessedSeriesItem).matches[0]}
                                    matches={(item as ProcessedSeriesItem).matches}
                                    onClick={openMatch}
                                    showSeriesButton={true}
                                    onViewSeries={openSeries}
                                />
                            ) : item.type === 'tournament' && (item as ProcessedMatchItem).match ? (
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
                            <div className="view-more-icon">
                                <LuCalendarDays size={24} />
                            </div>
                            <span className="view-more-text">Full Calendar</span>
                            <span className="view-more-count">{upcomingMatches.length} total</span>
                        </button>
                    </div>
                ) : (
                    <div className="empty-state">No upcoming matches</div>
                )}
            </section>

            {/* Gradient Accent Banner Entry Point */}
            <div
                onClick={onOpenUpcomingList}
                style={{
                    margin: '-12px 20px 8px', // Even tighter spacing
                }}
            >
                <div style={{
                    height: '1px',
                    background: 'linear-gradient(90deg, #6366f1 0%, rgba(99, 102, 241, 0) 100%)',
                    marginBottom: '6px', // Reduced from 8px
                    opacity: 0.8
                }} />
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                }}>
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.6)',
                        letterSpacing: '0.3px'
                    }}>
                        View all {upcomingMatches.length} upcoming matches
                    </span>
                    <span style={{
                        fontSize: '16px',
                        color: '#6366f1',
                        fontWeight: 300,
                        transform: 'translateY(-1px)'
                    }}>→</span>
                </div>
            </div>

            {/* Results Section - .PAST Design */}
            <section className="section">
                {/* Header Row: .PAST + Time Chips */}
                <div style={{
                    padding: '0 20px 8px 16px',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    <PastFilter
                        value={resultsTimeFilter}
                        onChange={(v) => {
                            setLastChangedResultsFilter('time');
                            setResultsTimeFilter(v);
                        }}
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
                    {resultsChips.map(chip => (
                        <div
                            key={chip.id}
                            onClick={() => {
                                setLastChangedResultsFilter('type');
                                setActiveResultsChip(chip.id);
                            }}
                            style={{
                                padding: '5px 10px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: chip.id === activeResultsChip ? 600 : 500,
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                flexShrink: 0,
                                transition: 'all 0.2s ease',
                                background: chip.id === activeResultsChip
                                    ? 'rgba(245, 158, 11, 0.25)'
                                    : 'rgba(20, 20, 20, 0.5)',
                                border: chip.id === activeResultsChip
                                    ? '1px solid rgba(245, 158, 11, 0.5)'
                                    : '1px solid rgba(255, 255, 255, 0.08)',
                                color: chip.id === activeResultsChip ? '#fcd34d' : 'rgba(255,255,255,0.6)',
                            }}
                        >
                            {typeof chip.label === 'string' ? chip.label : String(chip.label || '')}
                        </div>
                    ))}
                </div>

                {loading && matches.length === 0 ? (
                    <div className="horizontal-scroll">
                        <SkeletonMatchCard />
                        <SkeletonMatchCard />
                    </div>
                ) : filteredCompleted.length > 0 ? (
                    <div className="horizontal-scroll" ref={resultsScrollRef}>
                        {filteredCompleted.slice(0, resultsLimit).map((item, idx) => (
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
                        {resultsLimit < filteredCompleted.length && (
                            <button
                                className="view-more-card"
                                onClick={loadMoreResults}
                            >
                                <span className="view-more-icon">+</span>
                                <span className="view-more-text">View All</span>
                                <span className="view-more-count">Results</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="empty-state">No results found</div>
                )}
            </section>

            {/* Gradient Accent Banner for Results */}
            <div style={{ margin: '-12px 20px 8px' }}>
                <div style={{
                    height: '1px',
                    background: 'linear-gradient(90deg, #f59e0b 0%, rgba(245, 158, 11, 0) 100%)',
                    marginBottom: '6px',
                    opacity: 0.8
                }} />
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                }}>
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.6)',
                        letterSpacing: '0.3px'
                    }}>
                        {completedMatches.length} completed matches
                    </span>
                    <span style={{
                        fontSize: '16px',
                        color: '#f59e0b',
                        fontWeight: 300,
                        transform: 'translateY(-1px)'
                    }}>→</span>
                </div>
            </div>

            {/* Wisden Attribution Footer */}
            <div style={{ padding: '16px 20px 48px' }}>
                <a
                    href="https://wisden.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                        background: 'linear-gradient(180deg, rgba(20, 20, 20, 0.8) 0%, rgba(10, 10, 10, 0.9) 100%)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 20,
                        padding: '24px 32px',
                        border: '1px solid rgba(251, 191, 36, 0.2)',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                    }}
                >
                    {/* Large Logo */}
                    <div style={{
                        background: '#f59e0b',
                        borderRadius: 16,
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)'
                    }}>
                        <img
                            src={wisdenLogo}
                            alt="Wisden"
                            style={{ height: 50, width: 'auto', mixBlendMode: 'multiply' }}
                        />
                    </div>

                    {/* Text */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: 12,
                            fontWeight: 500,
                            marginBottom: 4
                        }}>
                            Data powered by
                        </div>
                        <div style={{
                            color: '#fbbf24',
                            fontSize: 18,
                            fontWeight: 700,
                            letterSpacing: 0.5
                        }}>
                            wisden.com
                        </div>
                    </div>
                </a>
            </div>
        </>
    );
}
