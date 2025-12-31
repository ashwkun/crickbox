/**
 * UpcomingListPage - Full-screen upcoming matches list
 * Features day-grouped layout with dual filtering (Time + Category)
 */

import React, { useState, useMemo } from 'react';
import { Match } from '../../types';
import { LuArrowLeft, LuCalendarDays, LuClock } from 'react-icons/lu';
import TimeFilter, { TimeFilterValue } from './TimeFilter';
import { filterByTime, getDayLabel } from '../../utils/upcomingUtils';
import { getTeamColor } from '../../utils/teamColors';

interface UpcomingListPageProps {
    matches: Match[];
    onBack: () => void;
    onMatchClick: (match: Match) => void;
    onSeriesClick?: (seriesId: string) => void;
}

const UpcomingListPage: React.FC<UpcomingListPageProps> = ({
    matches,
    onBack,
    onMatchClick,
    onSeriesClick,
}) => {
    const [timeFilter, setTimeFilter] = useState<TimeFilterValue>('all');

    // Apply time filter
    const filteredMatches = useMemo(() => {
        return filterByTime(matches, timeFilter);
    }, [matches, timeFilter]);

    // Group by date
    const groupedMatches = useMemo(() => {
        const groups: { label: string; date: Date; matches: Match[] }[] = [];
        const dateMap = new Map<string, Match[]>();

        filteredMatches.forEach(match => {
            const date = new Date(match.start_date);
            const label = getDayLabel(date);

            if (!dateMap.has(label)) {
                dateMap.set(label, []);
            }
            dateMap.get(label)!.push(match);
        });

        dateMap.forEach((dayMatches, label) => {
            groups.push({
                label,
                date: new Date(dayMatches[0].start_date),
                matches: dayMatches.sort((a, b) =>
                    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
                ),
            });
        });

        return groups.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [filteredMatches]);

    const formatTime = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(10, 10, 10, 0.9)',
                backdropFilter: 'blur(20px)',
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <LuArrowLeft size={24} />
                </button>
                <h1 style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    flex: 1,
                }}>UPCOMING SCHEDULE</h1>
                <TimeFilter value={timeFilter} onChange={setTimeFilter} />
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px 40px',
            }}>
                {groupedMatches.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: 'var(--text-muted)',
                    }}>
                        <LuCalendarDays size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p>No matches found for this time period.</p>
                    </div>
                ) : (
                    groupedMatches.map(group => (
                        <div key={group.label} style={{ marginBottom: 24 }}>
                            {/* Day Header */}
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: 'var(--text-secondary)',
                                marginBottom: 12,
                                letterSpacing: '1px',
                            }}>
                                {group.label}
                            </div>

                            {/* Match Rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {group.matches.map(match => {
                                    const team1 = match.participants?.[0];
                                    const team2 = match.participants?.[1];
                                    const color1 = getTeamColor(team1?.name || '');
                                    const color2 = getTeamColor(team2?.name || '');

                                    return (
                                        <div
                                            key={match.game_id}
                                            onClick={() => onMatchClick(match)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: '14px 16px',
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 12,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {/* Accent Bar */}
                                            <div style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: 4,
                                                background: `linear-gradient(180deg, ${color1} 0%, ${color2} 100%)`,
                                            }} />

                                            {/* Match Info */}
                                            <div style={{ flex: 1, marginLeft: 8 }}>
                                                <div style={{
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    color: '#fff',
                                                    marginBottom: 4,
                                                }}>
                                                    {team1?.short_name || 'TBD'} vs {team2?.short_name || 'TBD'}
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: 'var(--text-muted)',
                                                }}>
                                                    {match.event_name} • {match.series_name}
                                                </div>
                                            </div>

                                            {/* Time */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '6px 10px',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: 8,
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: 'var(--text-secondary)',
                                            }}>
                                                <LuClock size={12} />
                                                {formatTime(match.start_date)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UpcomingListPage;
