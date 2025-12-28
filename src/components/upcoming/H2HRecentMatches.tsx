import React from 'react';
import { RecentMatch } from '../../utils/h2hApi';

interface H2HRecentMatchesProps {
    matches: RecentMatch[];
    teamIds: [number, number]; // [team1Id, team2Id]
    teamNames: [string, string]; // [team1Name, team2Name]
    format?: string; // "test", "odi", "t20" etc
    onMatchClick?: (gameId: string) => void;
}

const H2HRecentMatches: React.FC<H2HRecentMatchesProps> = ({ matches, teamIds, teamNames, format, onMatchClick }) => {
    if (!matches || matches.length === 0) return null;

    const formatDate = (dateStr: string) => {
        try {
            const [datePart] = dateStr.split(' ');
            const [month, day, year] = datePart.split('/');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        } catch {
            return '';
        }
    };

    const getMarginText = (match: RecentMatch) => {
        if (match.result_short === 'd') return '';
        const margin = match.margin_value;
        if (match.win_by === 'r') return `by ${margin} runs`;
        if (match.win_by === 'w') return `by ${margin} wkts`;
        if (match.win_by === 'i') return `by inn & ${margin}`;
        return '';
    };

    // Get short name from passed team names
    const getTeamShort = (index: 0 | 1): string => {
        return teamNames[index]?.slice(0, 3).toUpperCase() || `T${index + 1}`;
    };

    // Format innings - show all innings for a team
    const formatInnings = (innings: RecentMatch['innings'], battingTeamId: number) => {
        const teamInnings = innings?.filter(i => i.batting_team === battingTeamId) || [];
        if (teamInnings.length === 0) return '-';

        return teamInnings.map(inn => `${inn.total}/${inn.wickets}`).join(' & ');
    };

    // Format display name
    const formatDisplay = format?.toUpperCase() || 'Matches';

    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
            }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Recent H2H in {formatDisplay}
                </span>
                <span style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '4px',
                    color: 'rgba(255,255,255,0.6)'
                }}>
                    Last {matches.length}
                </span>
            </div>

            {/* Horizontal Scroll Container */}
            <div style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                paddingBottom: '8px',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch'
            }}>
                {matches.slice(0, 5).map((match, idx) => {
                    const isDraw = match.result_short === 'd';
                    const winnerColor = isDraw ? '#94a3b8' : '#22c55e';

                    return (
                        <div
                            key={match.id || idx}
                            onClick={() => onMatchClick?.(match.file_name)}
                            style={{
                                minWidth: '230px',
                                maxWidth: '230px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                padding: '14px',
                                background: 'var(--bg-secondary)',
                                borderRadius: '14px',
                                scrollSnapAlign: 'start',
                                flexShrink: 0,
                                cursor: onMatchClick ? 'pointer' : 'default',
                                transition: 'transform 0.15s, background 0.15s',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}
                            onMouseEnter={(e) => {
                                if (onMatchClick) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                            }}
                        >
                            {/* Top: Venue + Date */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                    {match.venue_city}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                    {formatDate(match.match_start_date)}
                                </span>
                            </div>

                            {/* Team Scores */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {/* Team 1 */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '6px 10px',
                                    background: match.winner_team_id === teamIds[0] && !isDraw
                                        ? 'rgba(34, 197, 94, 0.1)'
                                        : 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    borderLeft: match.winner_team_id === teamIds[0] && !isDraw
                                        ? '3px solid #22c55e'
                                        : '3px solid transparent'
                                }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: match.winner_team_id === teamIds[0] && !isDraw ? '#22c55e' : 'var(--text-primary)' }}>
                                        {getTeamShort(0)}
                                    </span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {formatInnings(match.innings, teamIds[0])}
                                    </span>
                                </div>

                                {/* Team 2 */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '6px 10px',
                                    background: match.winner_team_id === teamIds[1] && !isDraw
                                        ? 'rgba(34, 197, 94, 0.1)'
                                        : 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    borderLeft: match.winner_team_id === teamIds[1] && !isDraw
                                        ? '3px solid #22c55e'
                                        : '3px solid transparent'
                                }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: match.winner_team_id === teamIds[1] && !isDraw ? '#22c55e' : 'var(--text-primary)' }}>
                                        {getTeamShort(1)}
                                    </span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {formatInnings(match.innings, teamIds[1])}
                                    </span>
                                </div>
                            </div>

                            {/* Result */}
                            <div style={{
                                fontSize: '11px',
                                color: winnerColor,
                                fontWeight: 600,
                                textAlign: 'center',
                                marginTop: '4px'
                            }}>
                                {isDraw ? 'Match Drawn' : `${match.winner_team_name?.split(' ')[0]} won ${getMarginText(match)}`}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default H2HRecentMatches;
