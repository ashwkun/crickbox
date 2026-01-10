/**
 * CompletedListPage - Full calendar view for results
 * Row 1: Time filters (Months going backward)
 * Row 2: Dynamic type chips
 * Body: Series-centric layout with horizontal CompletedCard scrolls
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Match } from '../../types';
import { LuFilter, LuChevronRight, LuX, LuCalendarDays } from 'react-icons/lu';
import CompletedCard from '../CompletedCard';
import { generateUpcomingChips, filterByChip } from '../../utils/matchPriority';
import { isTBCName } from '../../utils/tbcMatch';

interface CompletedListPageProps {
    matches: Match[]; // Should be ALL completed matches (no slice)
    onBack: () => void;
    onMatchClick: (match: Match) => void;
    onSeriesClick?: (seriesId: string, matches?: Match[]) => void;
    isVisible?: boolean;
}

// Generate time filter chips based on current date (GOING BACKWARDS)
const generateTimeChips = (): { id: string; label: string; startMonth: number; startYear: number; endMonth: number; endYear: number }[] => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    const chips: { id: string; label: string; startMonth: number; startYear: number; endMonth: number; endYear: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // 1. Last 30 Days (Special Chip) - Logic handled in filter
    chips.push({
        id: 'last30',
        label: 'Last 30 Days',
        startMonth: -1, startYear: -1, endMonth: -1, endYear: -1 // Special markers
    });

    // 2. Current Month and going back 12 months
    let month = currentMonth;
    let year = currentYear;

    for (let i = 0; i < 12; i++) {
        chips.push({
            id: `${year}-${month}`,
            label: `${monthNames[month]} ${year !== currentYear ? year : ''}`.trim(),
            startMonth: month,
            startYear: year,
            endMonth: month,
            endYear: year,
        });

        month--;
        if (month < 0) {
            month = 11;
            year--;
        }
    }

    // 3. Previous Year (Aggregate)
    const prevYear = year; // After loop, variable 'year' is roughly 1 year ago or part of it
    // Actually, let's just add the full year prior to the last fetched month? 
    // Or just "2024" etc.
    // For simplicity, let's just stick to 12 months for now.

    return chips;
};

// Team priority for chip ordering
const TEAM_PRIORITY: Record<string, number> = {
    'India': 1, 'IND': 1,
    'India Women': 2, 'IND-W': 2, 'India W': 2,
    'England': 3, 'ENG': 3,
    'Australia': 4, 'AUS': 4,
    'Chennai Super Kings': 5, 'CSK': 5,
    'Mumbai Indians': 6, 'MI': 6,
    'Royal Challengers': 7, 'RCB': 7,
};

const CompletedListPage: React.FC<CompletedListPageProps> = ({
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
    const showFiltersRef = useRef(false);
    const isScrollActiveRef = useRef(false);
    const lastScrollY = useRef(0);
    const scrollAccumulator = useRef(0);

    useEffect(() => {
        showFiltersRef.current = showFilters;
    }, [showFilters]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!isScrollActiveRef.current) return;
        const currentScrollY = e.currentTarget.scrollTop;
        const delta = currentScrollY - lastScrollY.current;

        if (Math.sign(delta) === Math.sign(scrollAccumulator.current)) {
            scrollAccumulator.current += delta;
        } else {
            scrollAccumulator.current = delta;
        }

        if (scrollAccumulator.current > 50 && showFiltersRef.current) {
            setShowFilters(false);
            scrollAccumulator.current = 0;
        }

        if (scrollAccumulator.current < -50 && !showFiltersRef.current) {
            setShowFilters(true);
            scrollAccumulator.current = 0;
        }
        lastScrollY.current = currentScrollY;
    };

    // Filter matches by time
    const timeFilteredMatches = useMemo(() => {
        const chip = timeChips.find(c => c.id === selectedTime);
        if (!chip) return matches;

        // Special handling for "Last 30 Days"
        if (selectedTime === 'last30') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return matches.filter(m => {
                const date = m.end_date ? new Date(m.end_date) : new Date(m.start_date);
                return date >= thirtyDaysAgo;
            });
        }

        return matches.filter(match => {
            const date = match.end_date ? new Date(match.end_date) : new Date(match.start_date);
            const matchMonth = date.getMonth();
            const matchYear = date.getFullYear();

            if (matchYear !== chip.startYear) return false;
            // Strict month check for now (since start=end for monthly chips)
            if (matchMonth !== chip.startMonth) return false;

            return true;
        });
    }, [matches, selectedTime, timeChips]);

    // Generate dynamic type chips
    const typeChips = useMemo(() => {
        return generateUpcomingChips(timeFilteredMatches);
    }, [timeFilteredMatches]);

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

    // Generate team chips
    const teamChips = useMemo(() => {
        const teamCounts = new Map<string, { name: string; shortName: string; count: number }>();

        typeFilteredMatches.forEach(match => {
            match.participants?.forEach(p => {
                const name = p.name || '';
                const shortName = p.short_name || name.slice(0, 3).toUpperCase();
                if (!p.id || !name || isTBCName(name) || isTBCName(shortName)) return;

                const existing = teamCounts.get(name);
                if (existing) {
                    existing.count++;
                } else {
                    teamCounts.set(name, { name, shortName, count: 1 });
                }
            });
        });

        const sorted = Array.from(teamCounts.values()).sort((a, b) => {
            const priorityA = TEAM_PRIORITY[a.name] || TEAM_PRIORITY[a.shortName] || 100;
            const priorityB = TEAM_PRIORITY[b.name] || TEAM_PRIORITY[b.shortName] || 100;
            if (priorityA !== priorityB) return priorityA - priorityB;
            return b.count - a.count;
        });

        return [
            { id: 'all', label: 'All Teams', count: 0 },
            ...sorted.map(t => ({ id: t.name, label: t.shortName, count: t.count }))
        ];
    }, [typeFilteredMatches]);

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

        // Sort by END DATE DESCENDING
        const sorted = [...filteredMatches].sort((a, b) => {
            const dateA = a.end_date ? new Date(a.end_date).getTime() : new Date(a.start_date).getTime();
            const dateB = b.end_date ? new Date(b.end_date).getTime() : new Date(b.start_date).getTime();
            return dateB - dateA;
        });

        sorted.forEach(match => {
            const seriesId = match.series_id || 'unknown';
            if (!groups.has(seriesId)) {
                groups.set(seriesId, {
                    seriesName: match.series_name || 'Individual Matches',
                    seriesId,
                    matches: [],
                });
            }
            groups.get(seriesId)!.matches.push(match);
        });

        // Sort groups by latest match date
        return Array.from(groups.values()).sort((a, b) => {
            const getLatestDate = (matches: Match[]) => {
                // Assumes matches are already sorted desc
                const m = matches[0];
                return m.end_date ? new Date(m.end_date).getTime() : new Date(m.start_date).getTime();
            };
            return getLatestDate(b.matches) - getLatestDate(a.matches);
        });
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
            ? 'rgba(245, 158, 11, 0.25)' // Amber for Results
            : 'rgba(255, 255, 255, 0.05)',
        border: isSelected
            ? '1px solid rgba(245, 158, 11, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        color: isSelected ? '#fcd34d' : 'rgba(255, 255, 255, 0.6)',
        transition: 'all 0.2s ease',
    });

    const stickyChipStyle: React.CSSProperties = {
        padding: '6px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        flexShrink: 0,
        background: 'rgba(245, 158, 11, 0.15)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        color: '#fcd34d',
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
                            ? 'rgba(245, 158, 11, 0.2)'
                            : stickyChipStyle.background,
                        borderColor: showFilters || selectedTypeChip !== 'all' || selectedTeamChip !== 'all'
                            ? 'rgba(245, 158, 11, 0.4)'
                            : stickyChipStyle.borderColor,
                        color: showFilters || selectedTypeChip !== 'all' || selectedTeamChip !== 'all'
                            ? '#fcd34d'
                            : stickyChipStyle.color,
                    }}
                    onClick={() => {
                        if (showFilters) {
                            setShowFilters(false);
                            isScrollActiveRef.current = false;
                        } else {
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
                {/* Optional "Active Filter" Feedback */}
                {/* 
                {(selectedTypeChip !== 'all' || selectedTeamChip !== 'all' || selectedTime !== 'last30') && (
                     <div style={{ padding: '0 16px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                         Found {filteredMatches.length} matches
                     </div>
                )}
                */}

                {seriesGroups.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        color: 'var(--text-muted)',
                    }}>
                        <LuCalendarDays size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p style={{ fontSize: 14 }}>No results found</p>
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
                                {onSeriesClick && group.seriesId !== 'unknown' && (
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

                            {/* Horizontal Scroll of CompletedCards */}
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
                                        <CompletedCard
                                            match={match}
                                            matches={group.matches} // Pass context for potential series overlay
                                            onClick={onMatchClick}
                                        // No "View Series" buttons inside the card here, cleaner look
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CompletedListPage;
