import React from 'react';
import { RecentMatch } from '../../utils/h2hApi';

interface RecentFormProps {
    matches: RecentMatch[];
    teamIds: [number, number]; // [team1Id, team2Id]
    teamNames: [string, string]; // [team1Name, team2Name] - pass from parent
    format?: string; // "test", "odi", "t20" etc
    onMatchClick?: (gameId: string) => void; // Callback when match is clicked
}

const RecentForm: React.FC<RecentFormProps> = ({ matches, teamIds, teamNames, format, onMatchClick }) => {
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
    const formatDisplay = format?.toUpperCase() || 'TESTS';

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

            {/* Horizontal Scroll Container - Full Bleed with Padding via Spacers */}
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
                                transition: 'transform 0.15s, background 0.15s'
                            }}
                            onMouseEnter={(e) => {
                                if (onMatchClick) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            {/* Top: Venue + Date */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {match.venue_city}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                    {formatDate(match.match_start_date)}
                                </span>
                            </div>

                            {/* Team Scores - Both Teams */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {/* Team 1 */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 10px',
                                    background: match.winner_team_id === teamIds[0] && !isDraw
                                        ? 'rgba(34, 197, 94, 0.1)'
                                        : 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    borderLeft: match.winner_team_id === teamIds[0] && !isDraw
                                        ? '3px solid #22c55e'
                                        : '3px solid transparent'
                                }}>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: match.winner_team_id === teamIds[0] && !isDraw ? '#22c55e' : 'var(--text-primary)',
                                        minWidth: '45px'
                                    }}>
                                        {getTeamShort(0)}
                                    </span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
                                        {formatInnings(match.innings, teamIds[0])}
                                    </span>
                                </div>

                                {/* Team 2 */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 10px',
                                    background: match.winner_team_id === teamIds[1] && !isDraw
                                        ? 'rgba(34, 197, 94, 0.1)'
                                        : 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    borderLeft: match.winner_team_id === teamIds[1] && !isDraw
                                        ? '3px solid #22c55e'
                                        : '3px solid transparent'
                                }}>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: match.winner_team_id === teamIds[1] && !isDraw ? '#22c55e' : 'var(--text-primary)',
                                        minWidth: '45px'
                                    }}>
                                        {getTeamShort(1)}
                                    </span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
                                        {formatInnings(match.innings, teamIds[1])}
                                    </span>
                                </div>
                            </div>

                            {/* Result */}
                            <div style={{
                                fontSize: '11px',
                                color: winnerColor,
                                fontWeight: 600,
                                textAlign: 'center'
                            }}>
                                {isDraw ? 'Match Drawn' : `${match.winner_team_name} won ${getMarginText(match)}`}
                            </div>

                            {/* Player of Match */}
                            {match.match_player && (
                                <div style={{
                                    fontSize: '10px',
                                    color: 'var(--accent-primary)',
                                    fontWeight: 500,
                                    textAlign: 'center',
                                    paddingTop: '6px',
                                    borderTop: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    MOM: {match.match_player}
                                </div>
                            )}

                            {/* Tap hint */}
                            {onMatchClick && (
                                <div style={{
                                    fontSize: '9px',
                                    color: 'rgba(255,255,255,0.3)',
                                    textAlign: 'center'
                                }}>
                                    Tap for scorecard →
                                </div>
                            )}
                        </div>
                    );
                })}

            </div>
        </div>
    );
};

export default RecentForm;
