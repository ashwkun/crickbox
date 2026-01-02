/**
 * UpcomingListPage - Full calendar view with:
 * Row 1: Time filters (Custom + months + quarters + next year)
 * Row 2: Dynamic type chips from matchPriority utilities
 * Body: Series-centric layout with horizontal UpcomingCard scrolls
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Match } from '../../types';
import { LuFilter, LuChevronRight, LuX, LuCalendarDays } from 'react-icons/lu';
import UpcomingCard from '../UpcomingCard';
import { generateUpcomingChips, filterByChip, getMatchChip } from '../../utils/matchPriority';
import { isTBCName } from '../../utils/tbcMatch';

interface UpcomingListPageProps {
    matches: Match[];
    onBack: () => void;
    onMatchClick: (match: Match) => void;
    onSeriesClick?: (seriesId: string, matches?: Match[]) => void;
    isVisible?: boolean;
}

// Generate time filter chips based on current date
const generateTimeChips = (): { id: string; label: string; startMonth: number; startYear: number; endMonth: number; endYear: number }[] => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    const chips: { id: string; label: string; startMonth: number; startYear: number; endMonth: number; endYear: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let month = currentMonth;
    let year = currentYear;

    // Add first 4 individual months
    for (let i = 0; i < 4 && month <= 11; i++) {
        chips.push({
            id: `${year}-${month}`,
            label: monthNames[month],
            startMonth: month,
            startYear: year,
            endMonth: month,
            endYear: year,
        });
        month++;
    }

    // Add quarterly groups until December
    while (month <= 11) {
        const startMonth = month;
        // End at either +2 months or December, whichever is first
        const endMonth = Math.min(month + 2, 11);

        if (startMonth === endMonth) {
            // Single month
            chips.push({
                id: `${year}-${startMonth}`,
                label: monthNames[startMonth],
                startMonth,
                startYear: year,
                endMonth,
                endYear: year,
            });
        } else {
            // Range
            chips.push({
                id: `${year}-${startMonth}-${endMonth}`,
                label: `${monthNames[startMonth]}-${monthNames[endMonth]}`,
                startMonth,
                startYear: year,
                endMonth,
                endYear: year,
            });
        }
        month = endMonth + 1;
    }

    // Add next year
    chips.push({
        id: `${currentYear + 1}`,
        label: `${currentYear + 1}`,
        startMonth: 0,
        startYear: currentYear + 1,
        endMonth: 11,
        endYear: currentYear + 1,
    });

    return chips;
};

// Invalid team names to filter out (moved outside component to avoid hoisting issues)


// Team priority for chip ordering (moved outside component to avoid hoisting issues)
const TEAM_PRIORITY: Record<string, number> = {
    // India first
    'India': 1, 'IND': 1,
    'India Women': 2, 'IND-W': 2, 'India W': 2,
    // Major Test nations
    'England': 3, 'ENG': 3,
    'Australia': 4, 'AUS': 4,
    // IPL franchises
    'Chennai Super Kings': 5, 'CSK': 5,
    'Mumbai Indians': 6, 'MI': 6,
    'Royal Challengers': 7, 'RCB': 7,
    'Kolkata Knight Riders': 8, 'KKR': 8,
    'Gujarat Titans': 9, 'GT': 9,
    'Rajasthan Royals': 10, 'RR': 10,
    'Lucknow Super Giants': 11, 'LSG': 11,
    'Delhi Capitals': 12, 'DC': 12,
    'Sunrisers Hyderabad': 13, 'SRH': 13,
    'Punjab Kings': 14, 'PBKS': 14,
};

const UpcomingListPage: React.FC<UpcomingListPageProps> = ({
    matches,
    onBack,
    onMatchClick,
    onSeriesClick,
    isVisible = true,
}) => {
    const timeChips = useMemo(() => generateTimeChips(), []);
    const [selectedTime, setSelectedTime] = useState(timeChips[0]?.id || '');
    const [selectedTypeChip, setSelectedTypeChip] = useState('all');
    const [showCustomPicker, setShowCustomPicker] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);


    // Collapsible filter state
    const [showFilters, setShowFilters] = useState(false);

    // We use a ref to track filter state for the scroll handler to avoid closure staleness
    const showFiltersRef = useRef(false);

    // New ref to track if user has manually activated filters (enabling scroll behavior)
    const isScrollActiveRef = useRef(false);

    const lastScrollY = useRef(0);
    const scrollAccumulator = useRef(0);

    // Sync ref with state
    useEffect(() => {
        showFiltersRef.current = showFilters;
    }, [showFilters]);

    // Handle scroll for auto-hide/reveal filters
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        // Only handle scroll if filters were manually activated
        if (!isScrollActiveRef.current) return;

        const currentScrollY = e.currentTarget.scrollTop;
        const delta = currentScrollY - lastScrollY.current;

        // Accumulate scroll direction
        if (Math.sign(delta) === Math.sign(scrollAccumulator.current)) {
            scrollAccumulator.current += delta;
        } else {
            scrollAccumulator.current = delta; // Reset on direction change
        }

        // Collapse: require significant downward scroll (50px accumulated) to hide
        if (scrollAccumulator.current > 50 && showFiltersRef.current) {
            setShowFilters(false);
            scrollAccumulator.current = 0;
        }

        // Reveal: require significant upward scroll (50px accumulated) to show
        if (scrollAccumulator.current < -50 && !showFiltersRef.current) {
            setShowFilters(true);
            scrollAccumulator.current = 0;
        }

        lastScrollY.current = currentScrollY;
    };

    // Filter matches by time
    const timeFilteredMatches = useMemo(() => {
        const chip = timeChips.find(c => c.id === selectedTime);
        if (!chip) return matches.filter(m => m.event_state === 'U');

        return matches.filter(match => {
            // Only show upcoming matches
            if (match.event_state !== 'U') return false;

            const matchDate = new Date(match.start_date);
            const matchMonth = matchDate.getMonth();
            const matchYear = matchDate.getFullYear();

            if (matchYear < chip.startYear || matchYear > chip.endYear) return false;
            if (matchYear === chip.startYear && matchMonth < chip.startMonth) return false;
            if (matchYear === chip.endYear && matchMonth > chip.endMonth) return false;

            return true;
        });
    }, [matches, selectedTime, timeChips]);

    // Generate dynamic type chips based on time-filtered matches
    const typeChips = useMemo(() => {
        return generateUpcomingChips(timeFilteredMatches);
    }, [timeFilteredMatches]);

    // Reset type selection if chip no longer exists
    useEffect(() => {
        if (selectedTypeChip !== 'all' && !typeChips.find(c => c.id === selectedTypeChip)) {
            setSelectedTypeChip('all');
        }
    }, [typeChips, selectedTypeChip]);

    // Filter matches by type chip
    const typeFilteredMatches = useMemo(() => {
        return filterByChip(timeFilteredMatches, selectedTypeChip);
    }, [timeFilteredMatches, selectedTypeChip]);

    // Team filter state
    const [selectedTeamChip, setSelectedTeamChip] = useState('all');

    // Generate team chips from matches
    const teamChips = useMemo(() => {
        const teamCounts = new Map<string, { name: string; shortName: string; count: number }>();

        typeFilteredMatches.forEach(match => {
            match.participants?.forEach(p => {
                const name = p.name || '';
                const shortName = p.short_name || name.slice(0, 3).toUpperCase();

                // Skip invalid teams: no ID, empty name, or placeholder names
                if (!p.id || !name || isTBCName(name) || isTBCName(shortName)) return;

                const existing = teamCounts.get(name);
                if (existing) {
                    existing.count++;
                } else {
                    teamCounts.set(name, { name, shortName, count: 1 });
                }
            });
        });

        // Sort by priority, then by count
        const sorted = Array.from(teamCounts.values()).sort((a, b) => {
            const priorityA = TEAM_PRIORITY[a.name] || TEAM_PRIORITY[a.shortName] || 100;
            const priorityB = TEAM_PRIORITY[b.name] || TEAM_PRIORITY[b.shortName] || 100;
            if (priorityA !== priorityB) return priorityA - priorityB;
            return b.count - a.count; // Higher count first if same priority
        });

        return [
            { id: 'all', label: 'All Teams', count: 0 },
            ...sorted.map(t => ({ id: t.name, label: t.shortName, count: t.count }))
        ];
    }, [typeFilteredMatches]);

    // Reset team selection if chip no longer exists
    useEffect(() => {
        if (selectedTeamChip !== 'all' && !teamChips.find(c => c.id === selectedTeamChip)) {
            setSelectedTeamChip('all');
        }
    }, [teamChips, selectedTeamChip]);



    // Filter matches by team chip
    const filteredMatches = useMemo(() => {
        if (selectedTeamChip === 'all') return typeFilteredMatches;
        return typeFilteredMatches.filter(match =>
            match.participants?.some(p => p.name === selectedTeamChip)
        );
    }, [typeFilteredMatches, selectedTeamChip]);

    // Group matches by series
    const seriesGroups = useMemo(() => {
        const groups = new Map<string, { seriesName: string; seriesId: string; matches: Match[] }>();

        // Sort by date first
        const sorted = [...filteredMatches].sort((a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );

        sorted.forEach(match => {
            const seriesId = match.series_id;
            if (!groups.has(seriesId)) {
                groups.set(seriesId, {
                    seriesName: match.series_name || 'Unknown Series',
                    seriesId,
                    matches: [],
                });
            }
            groups.get(seriesId)!.matches.push(match);
        });

        // Sort groups by earliest match date
        return Array.from(groups.values()).sort((a, b) =>
            new Date(a.matches[0].start_date).getTime() - new Date(b.matches[0].start_date).getTime()
        );
    }, [filteredMatches]);

    const chipStyle = (isSelected: boolean): React.CSSProperties => ({
        padding: '6px 14px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        flexShrink: 0,
        background: isSelected
            ? 'rgba(99, 102, 241, 0.2)'
            : 'rgba(255, 255, 255, 0.05)',
        border: isSelected
            ? '1px solid rgba(99, 102, 241, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        color: isSelected ? '#a5b4fc' : 'rgba(255, 255, 255, 0.6)',
        transition: 'all 0.2s ease',
    });

    const stickyChipStyle: React.CSSProperties = {
        padding: '6px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        flexShrink: 0,
        background: 'rgba(99, 102, 241, 0.15)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        color: '#a5b4fc',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-primary)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* Spacer for FloatingHeader */}
            <div style={{ height: 84 }} />

            {/* Row 1: Time Filter */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderBottom: showFilters ? 'none' : '1px solid rgba(255,255,255,0.05)',
                flexShrink: 0,
            }}>
                {/* More Filters Toggle */}
                <div
                    style={{
                        ...stickyChipStyle,
                        background: showFilters || selectedTypeChip !== 'all' || selectedTeamChip !== 'all'
                            ? 'rgba(99, 102, 241, 0.2)'
                            : stickyChipStyle.background,
                        borderColor: showFilters || selectedTypeChip !== 'all' || selectedTeamChip !== 'all'
                            ? 'rgba(99, 102, 241, 0.4)'
                            : stickyChipStyle.borderColor,
                        color: showFilters || selectedTypeChip !== 'all' || selectedTeamChip !== 'all'
                            ? '#6366f1'
                            : stickyChipStyle.color,
                    }}
                    onClick={() => {
                        if (showFilters) {
                            // Manual Close: Disable scroll auto-hide/reveal
                            setShowFilters(false);
                            isScrollActiveRef.current = false;
                        } else {
                            // Manual Open: Enable scroll auto-hide/reveal
                            setShowFilters(true);
                            isScrollActiveRef.current = true;
                        }
                    }}
                >
                    <LuFilter size={14} />
                    Filters
                    <span style={{
                        fontSize: 8,
                        marginLeft: 2,
                        transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }}>▼</span>
                </div>

                {/* Scrollable Time Chips */}
                <div style={{
                    display: 'flex',
                    gap: 6,
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    flex: 1,
                    paddingRight: 16,
                    marginRight: -16,
                }}>
                    <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                    {timeChips.map(chip => (
                        <div
                            key={chip.id}
                            style={chipStyle(selectedTime === chip.id)}
                            onClick={() => setSelectedTime(chip.id)}
                        >
                            {chip.label}
                        </div>
                    ))}
                </div>
            </div>



            {/* Collapsible Filter Rows */}
            <div style={{
                maxHeight: showFilters ? '200px' : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease',
            }}>
                {/* Row 2: Dynamic Type Filter */}
                <div style={{
                    display: 'flex',
                    gap: 6,
                    padding: '8px 16px 12px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    flexShrink: 0,
                }}>
                    {typeChips.map(chip => (
                        <div
                            key={chip.id}
                            style={chipStyle(selectedTypeChip === chip.id)}
                            onClick={() => setSelectedTypeChip(chip.id)}
                        >
                            {chip.label}
                            {chip.count > 0 && (
                                <span style={{
                                    marginLeft: 4,
                                    opacity: 0.5,
                                    fontSize: 10,
                                }}>
                                    {chip.count}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Row 3: Dynamic Team Filter */}
                <div style={{
                    display: 'flex',
                    gap: 6,
                    padding: '8px 16px 12px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    borderBottom: '1px solid var(--border-color)',
                    flexShrink: 0,
                }}>
                    {teamChips.map(chip => (
                        <div
                            key={chip.id}
                            style={chipStyle(selectedTeamChip === chip.id)}
                            onClick={() => setSelectedTeamChip(chip.id)}
                        >
                            {chip.label}
                            {chip.count > 0 && (
                                <span style={{
                                    marginLeft: 4,
                                    opacity: 0.5,
                                    fontSize: 10,
                                }}>
                                    {chip.count}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Body: Series-Centric Content */}
            <div
                ref={contentRef}
                onScroll={handleScroll}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px 0 40px',
                }}
            >
                {seriesGroups.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        color: 'var(--text-muted)',
                    }}>
                        <LuCalendarDays size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p style={{ fontSize: 14 }}>No matches in this period</p>
                    </div>
                ) : (
                    seriesGroups.map(group => (
                        <div key={group.seriesId} style={{ marginBottom: 24 }}>
                            {/* Series Header */}
                            <div
                                onClick={() => onSeriesClick?.(group.seriesId, group.matches)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 16px',
                                    cursor: onSeriesClick ? 'pointer' : 'default',
                                }}
                            >
                                <h3 style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: 'var(--text-secondary)',
                                    margin: 0,
                                    letterSpacing: '0.3px',
                                    textTransform: 'uppercase',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: 1.4,
                                    flex: 1,
                                }}>
                                    {group.seriesName}
                                </h3>
                                {onSeriesClick && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        color: 'var(--text-muted)',
                                        fontSize: 11,
                                        flexShrink: 0,
                                    }}>
                                        {group.matches.length} matches
                                        <LuChevronRight size={14} />
                                    </div>
                                )}
                            </div>

                            {/* Horizontal Scroll of UpcomingCards */}
                            <div style={{
                                display: 'flex',
                                gap: 16,
                                overflowX: 'auto',
                                scrollbarWidth: 'none',
                                padding: '4px 16px 8px',
                            }}>
                                <style>{`.series-cards::-webkit-scrollbar { display: none; }`}</style>
                                {group.matches.map(match => (
                                    <div key={match.game_id} style={{ flexShrink: 0, width: 280 }}>
                                        <UpcomingCard
                                            match={match}
                                            matches={group.matches}
                                            onClick={onMatchClick}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Custom Date Picker Modal (Placeholder) */}
            {showCustomPicker && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 3000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                }} onClick={() => setShowCustomPicker(false)}>
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: 16,
                            padding: 24,
                            maxWidth: 320,
                            width: '100%',
                            border: '1px solid var(--border-color)',
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20,
                        }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Custom Date Range</h3>
                            <LuX
                                size={20}
                                style={{ cursor: 'pointer', opacity: 0.6 }}
                                onClick={() => setShowCustomPicker(false)}
                            />
                        </div>
                        <p style={{
                            color: 'var(--text-muted)',
                            fontSize: 13,
                            textAlign: 'center',
                            padding: '40px 0',
                        }}>
                            Coming soon: Select specific dates, months, or ranges
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpcomingListPage;
