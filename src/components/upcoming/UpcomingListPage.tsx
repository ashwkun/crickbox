/**
 * UpcomingListPage - Premium "Next Up Hub"
 * Features: Date Pill Scroller, Series Cards, Featured Match Banner
 * Uses FloatingHeader from App.tsx (no custom header)
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Match } from '../../types';
import { LuCalendarDays, LuClock, LuChevronRight, LuChevronDown } from 'react-icons/lu';
import TimeFilter, { TimeFilterValue } from './TimeFilter';
import { filterByTime, getDayLabel, isToday, isTomorrow } from '../../utils/upcomingUtils';
import { getTeamColor } from '../../utils/teamColors';
import { getMatchPriority } from '../../utils/matchPriority';
import WikiImage from '../WikiImage';

interface UpcomingListPageProps {
    matches: Match[];
    onBack: () => void;
    onMatchClick: (match: Match) => void;
    onSeriesClick?: (seriesId: string) => void;
}

// ===== DATE PILL SCROLLER =====
interface DatePill {
    label: string;
    date: Date;
    hasMatches: boolean;
    matchCount: number;
}

const DatePillScroller: React.FC<{
    dates: DatePill[];
    selectedLabel: string;
    onSelect: (label: string) => void;
}> = ({ dates, selectedLabel, onSelect }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            padding: '0 20px 12px 16px',
        }}>
            <style>{`.date-pills::-webkit-scrollbar { display: none; }`}</style>
            {dates.map(d => {
                const isActive = d.label === selectedLabel;
                return (
                    <div
                        key={d.label}
                        onClick={() => d.hasMatches && onSelect(d.label)}
                        style={{
                            padding: '8px 14px',
                            borderRadius: 16,
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            cursor: d.hasMatches ? 'pointer' : 'default',
                            flexShrink: 0,
                            transition: 'all 0.2s ease',
                            background: isActive
                                ? 'rgba(99, 102, 241, 0.25)'
                                : 'rgba(20, 20, 20, 0.5)',
                            border: isActive
                                ? '1px solid rgba(99, 102, 241, 0.5)'
                                : '1px solid rgba(255, 255, 255, 0.08)',
                            color: isActive ? '#a5b4fc' : d.hasMatches ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                            opacity: d.hasMatches ? 1 : 0.5,
                            position: 'relative',
                        }}
                    >
                        {d.label}
                        {d.hasMatches && (
                            <span style={{
                                marginLeft: 6,
                                fontSize: 10,
                                opacity: 0.6,
                            }}>{d.matchCount}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ===== FEATURED MATCH BANNER =====
const FeaturedMatchBanner: React.FC<{
    match: Match;
    onClick: () => void;
}> = ({ match, onClick }) => {
    const team1 = match.participants?.[0];
    const team2 = match.participants?.[1];
    const color1 = getTeamColor(team1?.name || '');
    const color2 = getTeamColor(team2?.name || '');

    const startDate = new Date(match.start_date);
    const now = new Date();
    const hoursUntil = Math.max(0, Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
    const daysUntil = Math.floor(hoursUntil / 24);
    const remainingHours = hoursUntil % 24;

    let timeText = '';
    if (daysUntil > 0) {
        timeText = `${daysUntil}d ${remainingHours}h`;
    } else if (hoursUntil > 0) {
        timeText = `${hoursUntil} hours`;
    } else {
        timeText = 'Starting soon';
    }

    return (
        <div
            onClick={onClick}
            style={{
                margin: '0 16px 16px',
                padding: 20,
                borderRadius: 20,
                background: `linear-gradient(135deg, ${color1}40 0%, ${color2}40 100%), rgba(15, 15, 20, 0.95)`,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Glow effect */}
            <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                background: `radial-gradient(circle, ${color1}30 0%, transparent 70%)`,
                pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Badge */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    color: '#a5b4fc',
                    marginBottom: 12,
                    textTransform: 'uppercase',
                }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
                    Featured
                </div>

                {/* Teams */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 12,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                        <WikiImage
                            name={team1?.name || 'TBD'}
                            wikiTitle={team1?.name || undefined}
                            type="team"
                            style={{ width: 40, height: 40, borderRadius: 8 }}
                            fallbackStyle={{ fontSize: 14 }}
                        />
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                            {team1?.short_name || 'TBD'}
                        </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>vs</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                            {team2?.short_name || 'TBD'}
                        </span>
                        <WikiImage
                            name={team2?.name || 'TBD'}
                            wikiTitle={team2?.name || undefined}
                            type="team"
                            style={{ width: 40, height: 40, borderRadius: 8 }}
                            fallbackStyle={{ fontSize: 14 }}
                        />
                    </div>
                </div>

                {/* Series + Time */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        {match.event_name} • {match.series_name?.split(',')[0]}
                    </span>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#a5b4fc',
                    }}>
                        <LuClock size={12} />
                        {timeText}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ===== SERIES CARD =====
interface SeriesGroup {
    seriesId: string;
    seriesName: string;
    matches: Match[];
    nextMatch: Match;
    teamLogos: string[];
}

const SeriesCard: React.FC<{
    series: SeriesGroup;
    onMatchClick: (match: Match) => void;
    defaultExpanded?: boolean;
}> = ({ series, onMatchClick, defaultExpanded = true }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    // Group matches by day
    const dayGroups = useMemo(() => {
        const groups = new Map<string, Match[]>();
        series.matches.forEach(m => {
            const label = getDayLabel(new Date(m.start_date));
            if (!groups.has(label)) groups.set(label, []);
            groups.get(label)!.push(m);
        });
        return Array.from(groups.entries()).map(([label, matches]) => ({
            label,
            matches: matches.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
        }));
    }, [series.matches]);

    const formatTime = (dateStr: string): string => {
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <div style={{
            marginBottom: 16,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            overflow: 'hidden',
        }}>
            {/* Series Header */}
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)',
                }}
            >
                {/* Series Logo */}
                <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                }}>
                    🏏
                </div>

                {/* Series Info */}
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                        {series.seriesName.split(',')[0]}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {series.matches.length} match{series.matches.length !== 1 ? 'es' : ''} • Next: {getDayLabel(new Date(series.nextMatch.start_date))}
                    </div>
                </div>

                {/* Expand Icon */}
                <div style={{
                    color: 'rgba(255,255,255,0.4)',
                    transition: 'transform 0.2s',
                    transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                }}>
                    <LuChevronDown size={18} />
                </div>
            </div>

            {/* Matches (Expandable) */}
            <div style={{
                maxHeight: expanded ? 1000 : 0,
                opacity: expanded ? 1 : 0,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
            }}>
                {dayGroups.map(dayGroup => (
                    <div key={dayGroup.label}>
                        {/* Day Label */}
                        <div style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            padding: '8px 16px 4px',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            background: 'rgba(0,0,0,0.2)',
                        }}>
                            {dayGroup.label}
                        </div>

                        {/* Match Rows */}
                        {dayGroup.matches.map(match => {
                            const t1 = match.participants?.[0];
                            const t2 = match.participants?.[1];
                            const c1 = getTeamColor(t1?.name || '');
                            const c2 = getTeamColor(t2?.name || '');

                            return (
                                <div
                                    key={match.game_id}
                                    onClick={() => onMatchClick(match)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        borderTop: '1px solid rgba(255,255,255,0.04)',
                                        position: 'relative',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    {/* Team Color Bar */}
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: 3,
                                        background: `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`,
                                    }} />

                                    {/* Match Info */}
                                    <div style={{ flex: 1, marginLeft: 4 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                                            {t1?.short_name || 'TBD'} vs {t2?.short_name || 'TBD'}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {match.event_name}
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: 'rgba(255,255,255,0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}>
                                        <LuClock size={10} />
                                        {formatTime(match.start_date)}
                                    </div>

                                    <LuChevronRight size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ===== MAIN COMPONENT =====
const UpcomingListPage: React.FC<UpcomingListPageProps> = ({
    matches,
    onBack,
    onMatchClick,
    onSeriesClick,
}) => {
    const [timeFilter, setTimeFilter] = useState<TimeFilterValue>('all');
    const [selectedDate, setSelectedDate] = useState<string>('ALL');

    // Generate date pills
    const datePills = useMemo(() => {
        const pills: DatePill[] = [{ label: 'ALL', date: new Date(), hasMatches: matches.length > 0, matchCount: matches.length }];
        const dateMap = new Map<string, { date: Date; count: number }>();

        matches.forEach(m => {
            const d = new Date(m.start_date);
            const label = getDayLabel(d);
            if (!dateMap.has(label)) {
                dateMap.set(label, { date: d, count: 0 });
            }
            dateMap.get(label)!.count++;
        });

        Array.from(dateMap.entries())
            .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
            .slice(0, 14) // Max 2 weeks
            .forEach(([label, data]) => {
                pills.push({ label, date: data.date, hasMatches: true, matchCount: data.count });
            });

        return pills;
    }, [matches]);

    // Filter by date
    const dateFilteredMatches = useMemo(() => {
        if (selectedDate === 'ALL') return matches;
        return matches.filter(m => getDayLabel(new Date(m.start_date)) === selectedDate);
    }, [matches, selectedDate]);

    // Apply time filter
    const filteredMatches = useMemo(() => {
        return filterByTime(dateFilteredMatches, timeFilter);
    }, [dateFilteredMatches, timeFilter]);

    // Featured match (priority <= 15, within 48 hours)
    const featuredMatch = useMemo(() => {
        const now = new Date();
        const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        return matches
            .filter(m => {
                const priority = getMatchPriority(m);
                const startDate = new Date(m.start_date);
                return priority <= 15 && startDate >= now && startDate <= in48Hours;
            })
            .sort((a, b) => getMatchPriority(a) - getMatchPriority(b))[0];
    }, [matches]);

    // Group by series
    const seriesGroups = useMemo(() => {
        const groups = new Map<string, SeriesGroup>();

        filteredMatches.forEach(m => {
            const key = m.series_id || m.series_name || 'other';
            if (!groups.has(key)) {
                groups.set(key, {
                    seriesId: key,
                    seriesName: m.series_name || 'Other Matches',
                    matches: [],
                    nextMatch: m,
                    teamLogos: [],
                });
            }
            groups.get(key)!.matches.push(m);

            // Update next match if earlier
            const existing = groups.get(key)!;
            if (new Date(m.start_date) < new Date(existing.nextMatch.start_date)) {
                existing.nextMatch = m;
            }
        });

        // Sort series by next match date
        return Array.from(groups.values()).sort((a, b) =>
            new Date(a.nextMatch.start_date).getTime() - new Date(b.nextMatch.start_date).getTime()
        );
    }, [filteredMatches]);

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

            {/* Date Pills */}
            <DatePillScroller
                dates={datePills}
                selectedLabel={selectedDate}
                onSelect={setSelectedDate}
            />

            {/* Time Filter (collapsible .NEXT) */}
            <div style={{ padding: '0 16px 12px' }}>
                <TimeFilter value={timeFilter} onChange={setTimeFilter} />
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 16px 40px',
            }}>
                {/* Featured Banner */}
                {featuredMatch && selectedDate === 'ALL' && (
                    <FeaturedMatchBanner
                        match={featuredMatch}
                        onClick={() => onMatchClick(featuredMatch)}
                    />
                )}

                {/* Series Cards */}
                {seriesGroups.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: 'var(--text-muted)',
                    }}>
                        <LuCalendarDays size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p style={{ fontSize: 14 }}>No matches found.</p>
                        <p style={{ fontSize: 12, marginTop: 8, opacity: 0.6 }}>Try a different filter</p>
                    </div>
                ) : (
                    seriesGroups.map((series, idx) => (
                        <SeriesCard
                            key={series.seriesId}
                            series={series}
                            onMatchClick={onMatchClick}
                            defaultExpanded={idx < 3}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default UpcomingListPage;
