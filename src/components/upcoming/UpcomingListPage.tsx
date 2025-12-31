/**
 * UpcomingListPage - Full calendar view of upcoming matches
 * Simple vertical list using same UpcomingCard as HomePage
 * Uses FloatingHeader (no custom header)
 */

import React, { useMemo } from 'react';
import { Match } from '../../types';
import { LuCalendarDays } from 'react-icons/lu';
import { getDayLabel } from '../../utils/upcomingUtils';
import UpcomingCard from '../UpcomingCard';

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
    // Group matches by day
    const groupedMatches = useMemo(() => {
        const groups: { label: string; date: Date; matches: Match[] }[] = [];
        const dateMap = new Map<string, Match[]>();

        // Sort by date first
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

            {/* Content */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 0 40px',
            }}>
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
                        <div key={group.label} style={{ marginBottom: 20 }}>
                            {/* Day Header */}
                            <div style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'var(--text-secondary)',
                                padding: '12px 20px 8px',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                            }}>
                                {group.label}
                            </div>

                            {/* Horizontal scroll of cards - same as HomePage */}
                            <div className="horizontal-scroll" style={{ paddingLeft: 16 }}>
                                {group.matches.map(match => (
                                    <UpcomingCard
                                        key={match.game_id}
                                        match={match}
                                        onClick={onMatchClick}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UpcomingListPage;
