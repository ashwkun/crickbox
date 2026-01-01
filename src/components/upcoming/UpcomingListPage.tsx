/**
 * UpcomingListPage - Full calendar view with user-friendly navigation
 * Features: Date jump pills, sticky day headers, compact match rows
 * Uses FloatingHeader (no custom header)
 */

import React, { useMemo, useRef } from 'react';
import { Match } from '../../types';
import { LuCalendarDays, LuClock, LuChevronRight } from 'react-icons/lu';
import { getDayLabel } from '../../utils/upcomingUtils';
import { getTeamColor } from '../../utils/teamColors';
import WikiImage from '../WikiImage';

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
    const contentRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Group matches by day
    const groupedMatches = useMemo(() => {
        const groups: { label: string; date: Date; matches: Match[] }[] = [];
        const dateMap = new Map<string, Match[]>();

        const sorted = [...matches].sort((a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );

        sorted.forEach(match => {
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
                matches: dayMatches,
            });
        });

        return groups.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [matches]);

    // Jump to date section
    const scrollToDate = (label: string) => {
        const section = sectionRefs.current.get(label);
        if (section && contentRef.current) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const formatTime = (dateStr: string): string => {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
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

            {/* Date Jump Bar */}
            <div style={{
                display: 'flex',
                gap: 8,
                padding: '8px 16px 12px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                borderBottom: '1px solid var(--border-color)',
                flexShrink: 0,
            }}>
                <style>{`.date-jump-bar::-webkit-scrollbar { display: none; }`}</style>
                {groupedMatches.slice(0, 10).map(group => (
                    <button
                        key={group.label}
                        onClick={() => scrollToDate(group.label)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            flexShrink: 0,
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            transition: 'all 0.15s',
                        }}
                    >
                        {group.label}
                        <span style={{ marginLeft: 6, opacity: 0.5 }}>{group.matches.length}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div
                ref={contentRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0 16px 40px',
                }}
            >
                {groupedMatches.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        color: 'var(--text-muted)',
                    }}>
                        <LuCalendarDays size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p style={{ fontSize: 14 }}>No upcoming matches</p>
                    </div>
                ) : (
                    groupedMatches.map(group => (
                        <div
                            key={group.label}
                            ref={el => el && sectionRefs.current.set(group.label, el)}
                            style={{ marginBottom: 8 }}
                        >
                            {/* Sticky Day Header */}
                            <div style={{
                                position: 'sticky',
                                top: 0,
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'var(--text-secondary)',
                                padding: '12px 4px 8px',
                                letterSpacing: '0.5px',
                                background: 'var(--bg-primary)',
                                zIndex: 10,
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
                                                padding: '12px 14px',
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 14,
                                                cursor: 'pointer',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {/* Team Color Bar */}
                                            <div style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: 4,
                                                background: `linear-gradient(180deg, ${color1} 0%, ${color2} 100%)`,
                                            }} />

                                            {/* Team Logos */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: -8, marginLeft: 8 }}>
                                                <WikiImage
                                                    name={team1?.name || 'TBD'}
                                                    wikiTitle={team1?.name || undefined}
                                                    type="team"
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: 6,
                                                        border: '2px solid var(--bg-card)',
                                                        position: 'relative',
                                                        zIndex: 2,
                                                    }}
                                                    fallbackStyle={{ fontSize: 10 }}
                                                />
                                                <WikiImage
                                                    name={team2?.name || 'TBD'}
                                                    wikiTitle={team2?.name || undefined}
                                                    type="team"
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: 6,
                                                        border: '2px solid var(--bg-card)',
                                                        marginLeft: -8,
                                                        position: 'relative',
                                                        zIndex: 1,
                                                    }}
                                                    fallbackStyle={{ fontSize: 10 }}
                                                />
                                            </div>

                                            {/* Match Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: '#fff',
                                                    marginBottom: 2,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {team1?.short_name || 'TBD'} vs {team2?.short_name || 'TBD'}
                                                </div>
                                                <div style={{
                                                    fontSize: 11,
                                                    color: 'var(--text-muted)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {match.event_name}
                                                </div>
                                            </div>

                                            {/* Time */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: 'var(--text-secondary)',
                                                flexShrink: 0,
                                            }}>
                                                <LuClock size={11} />
                                                {formatTime(match.start_date)}
                                            </div>

                                            <LuChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
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
