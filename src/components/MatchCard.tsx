import React from 'react';
import WikiImage from './WikiImage';
import { getTeamColor } from '../utils/teamColors';
import { getMatchStatusConfig } from '../utils/matchStatus';

const MatchCard = ({ match, onClick, isHero = false }) => {
    const team1 = match.participants?.[0];
    const team2 = match.participants?.[1];

    // Get team colors for gradient
    const color1 = getTeamColor(team1?.name) || getTeamColor(team1?.short_name) || '#3b82f6';
    const color2 = getTeamColor(team2?.name) || getTeamColor(team2?.short_name) || '#8b5cf6';

    const renderScore = (score) => {
        if (!score) return <span className="match-team-score">-</span>;

        // Handle multi-innings (Test matches)
        if (score.includes('&')) {
            const parts = score.split('&').map(s => s.trim());
            return (
                <div className="score-stacked">
                    <span className="score-current">{parts[1] || parts[0]}</span>
                    {parts[1] && <span className="score-previous">{parts[0]}</span>}
                </div>
            );
        }
        return <span className="match-team-score">{score}</span>;
    };

    const formatSchedule = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    // Determine batting team from players_involved array
    // Team with a "batsman" type player is currently batting
    const isTeam1Batting = team1?.players_involved?.some((p: any) => p.type === 'batsman') || false;
    const isTeam2Batting = team2?.players_involved?.some((p: any) => p.type === 'batsman') || false;

    const renderHeroScore = (score, isBatting = false) => {
        const activeColor = '#22c55e';
        const completedColor = '#fff';
        const scoreColor = isBatting ? activeColor : completedColor;

        if (!score) return <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>-</span>;

        if (score.includes('&')) {
            const parts = score.split('&').map(s => s.trim());
            // Show latest score first (or prominent)
            // If there are 2 parts, parts[1] is the latest
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor }}>
                        {parts[1] || parts[0]}
                        {isBatting ? '*' : ''}
                    </span>
                    {parts[1] && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{parts[0]}</span>}
                </div>
            );
        }
        return <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor }}>{score}{isBatting ? '*' : ''}</span>;
    };

    // Hero Card Style - Same as UpcomingDetail
    const heroStyle: React.CSSProperties = {
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0f0f14',
        backgroundImage: `
            radial-gradient(ellipse 50% 60% at 10% 50%, ${color1}25 0%, transparent 100%),
            radial-gradient(ellipse 50% 60% at 90% 50%, ${color2}25 0%, transparent 100%)
        `,
        borderRadius: '20px',
        padding: '20px',
        margin: '0 20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        cursor: 'pointer',
    };

    if (isHero) {
        return (
            <div style={heroStyle} onClick={() => onClick(match)}>
                {/* Header: Series name + Day indicator + Status */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{
                            fontSize: 12,
                            color: 'rgba(255, 255, 255, 0.6)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '150px',
                        }}>
                            {match.series_name}
                        </span>
                        {match.event_day && (
                            <span style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '2px 8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: 4,
                                color: 'rgba(255, 255, 255, 0.7)',
                            }}>
                                Day {match.event_day}
                            </span>
                        )}
                    </div>
                    {match.event_state === 'L' && (() => {
                        const statusConfig = getMatchStatusConfig(match.short_event_status);
                        return (
                            <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '4px 10px',
                                background: statusConfig.bgColor,
                                borderRadius: 20,
                                color: statusConfig.color,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                            }}>
                                <span style={{ width: 5, height: 5, background: statusConfig.color, borderRadius: '50%' }} />
                                {statusConfig.text}
                            </span>
                        );
                    })()}
                </div>

                {/* Teams Row */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    {/* Team 1 */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        width: '35%',
                    }}>
                        <WikiImage
                            name={team1?.name}
                            id={team1?.id}
                            type="team"
                            style={{ width: 52, height: 52, objectFit: 'contain' }}
                        />
                        <span style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#fff',
                            textAlign: 'center',
                            whiteSpace: 'normal',
                            lineHeight: 1.2,
                        }}>{team1?.short_name}</span>
                        <div style={{ minHeight: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {renderHeroScore(team1?.value, isTeam1Batting)}
                        </div>
                    </div>

                    {/* VS */}
                    <div style={{
                        fontSize: 14,
                        fontWeight: 900,
                        color: 'rgba(255, 255, 255, 0.5)',
                    }}>VS</div>

                    {/* Team 2 */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        width: '35%',
                    }}>
                        <WikiImage
                            name={team2?.name}
                            id={team2?.id}
                            type="team"
                            style={{ width: 52, height: 52, objectFit: 'contain' }}
                        />
                        <span style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#fff',
                            textAlign: 'center',
                            whiteSpace: 'normal',
                            lineHeight: 1.2,
                        }}>{team2?.short_name}</span>
                        <div style={{ minHeight: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {renderHeroScore(team2?.value, isTeam2Batting)}
                        </div>
                    </div>
                </div>

                {/* Status - show event_sub_status (e.g., "Australia lead by 46 runs") */}
                {(match.event_sub_status || match.event_status) && (
                    <div style={{
                        marginTop: 16,
                        padding: '10px 14px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: 10,
                        textAlign: 'center',
                    }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                            {match.event_sub_status || match.event_status}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="match-card" onClick={() => onClick(match)}>
            <div className="match-card-header">
                <span className="match-series">{match.series_name}</span>
                {match.event_state === 'L' ? (
                    <span className="match-status live">
                        <span className="live-dot"></span>
                        {match.short_event_status || 'LIVE'}
                    </span>
                ) : (
                    <span className="match-status">{match.event_sub_status || match.event_status || 'Scheduled'}</span>
                )}
            </div>

            <div className="match-teams">
                {match.participants?.map((team, idx) => (
                    <div key={idx} className="match-team">
                        <div className="match-team-info">
                            <WikiImage
                                name={team.name}
                                id={team.id}
                                type="team"
                                className="match-team-logo"
                                style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain' }}
                            />
                            <span className="match-team-name">{team.short_name}</span>
                        </div>
                        {renderScore(team.value)}
                    </div>
                ))}
            </div>

            {match.event_state === 'U' ? (
                <div className="schedule-chip">
                    {formatSchedule(match.start_date)}
                </div>
            ) : match.event_state !== 'L' && match.result && (
                <div className="match-footer">
                    {match.result}
                </div>
            )}
        </div>
    );
};

export default MatchCard;
