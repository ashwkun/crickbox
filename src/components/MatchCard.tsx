import React, { useState, useEffect } from 'react';
import WikiImage, { getFlagUrl } from './WikiImage';
import { getTeamColor } from '../utils/teamColors';
import { getMatchStatusConfig } from '../utils/matchStatus';

// Live countdown component for pre-live matches
const CountdownStatusBox: React.FC<{ match: any }> = ({ match }) => {
    const [now, setNow] = useState(Date.now());
    const isPreLive = match.event_state === 'U';
    const startTime = new Date(match.start_date).getTime();
    const isCountingDown = isPreLive && startTime > now;

    useEffect(() => {
        if (!isCountingDown) return;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [isCountingDown]);

    const boxStyle: React.CSSProperties = {
        marginTop: 10,
        padding: '10px 14px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 10,
        textAlign: 'center',
        minHeight: 46,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 4,
    };

    if (isCountingDown) {
        const diff = Math.max(0, startTime - now);
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return (
            <div style={boxStyle}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Match starts in
                </span>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>
                    {mins > 0 && <>{mins}<span style={{ fontSize: 14, opacity: 0.7 }}>m </span></>}
                    {secs}<span style={{ fontSize: 14, opacity: 0.7 }}>s</span>
                </span>
            </div>
        );
    }

    return (
        <div style={boxStyle}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 500, lineHeight: 1.4 }}>
                {match.event_sub_status || match.event_status || '\u00A0'}
            </span>
        </div>
    );
};

interface MatchCardProps {
    match: any;
    onClick: (match: any) => void;
    isHero?: boolean;
    onSeriesClick?: (seriesId: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onClick, isHero = false, onSeriesClick }) => {
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
        margin: '0 8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        cursor: 'pointer',
        minWidth: 300,
        width: 'calc(100vw - 48px)', // 16px page padding + 8px card margin on each side
        maxWidth: 380,
        flexShrink: 0,
        scrollSnapAlign: 'center',
    };

    if (isHero) {
        return (
            <div style={heroStyle} onClick={() => onClick(match)}>
                {/* Row 1: Series/Tour name - centered */}
                <div
                    onClick={(e) => {
                        if (onSeriesClick) {
                            e.stopPropagation(); // Prevent card click
                            onSeriesClick(match.series_id);
                        }
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        marginBottom: 12,
                        cursor: onSeriesClick ? 'pointer' : 'default',
                    }}
                >
                    <span style={{
                        fontSize: 13,
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: 500,
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                    }}>
                        {match.series_name}
                    </span>
                    {onSeriesClick && <span style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.4)', flexShrink: 0 }}>›</span>}
                </div>

                {/* Row 2: Chips - Day | Status | Match format */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                }}>
                    {/* Day chip (Test matches only) */}
                    {match.event_day && (
                        <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '4px 10px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 20,
                            color: 'rgba(255, 255, 255, 0.8)',
                        }}>
                            Day {match.event_day}
                        </span>
                    )}

                    {/* Status chip (color-coded) */}
                    {(() => {
                        const isPreLive = match.event_state === 'U';
                        const isDelayed = match.short_event_status?.toLowerCase().includes('delayed') ||
                            match.event_status?.toLowerCase().includes('delayed');

                        if (match.event_state === 'L') {
                            // Actually live
                            const statusConfig = getMatchStatusConfig(match.short_event_status, match.event_status);
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
                                    <span
                                        className={statusConfig.isLive ? 'pulse-dot' : ''}
                                        style={{ width: 5, height: 5, background: statusConfig.color, borderRadius: '50%' }}
                                    />
                                    {statusConfig.text}
                                </span>
                            );
                        } else if (isPreLive && isDelayed) {
                            // Pre-live but delayed
                            return (
                                <span style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '4px 10px',
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    borderRadius: 20,
                                    color: '#f59e0b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                }}>
                                    <span style={{ width: 5, height: 5, background: '#f59e0b', borderRadius: '50%' }} />
                                    DELAYED
                                </span>
                            );
                        }
                        return null;
                    })()}

                    {/* Match format chip (e.g., Test 4/5) */}
                    {match.event_name && (
                        <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '4px 10px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            borderRadius: 20,
                            color: '#3b82f6',
                        }}>
                            {match.event_format?.toUpperCase() || ''} {match.event_name.match(/\d+/)?.[0] || ''}
                        </span>
                    )}
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
                            style={getFlagUrl(team1?.name)
                                ? { width: 52, height: 52, objectFit: 'contain' }
                                : { maxHeight: 52, width: 'auto', height: 'auto' }
                            }
                        />
                        <div style={{
                            minHeight: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <span style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#fff',
                                textAlign: 'center',
                                lineHeight: 1.3,
                            }}>{team1?.name}</span>
                        </div>
                        <div style={{ height: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
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
                            style={getFlagUrl(team2?.name)
                                ? { width: 52, height: 52, objectFit: 'contain' }
                                : { maxHeight: 52, width: 'auto', height: 'auto' }
                            }
                        />
                        <div style={{
                            minHeight: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <span style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#fff',
                                textAlign: 'center',
                                lineHeight: 1.3,
                            }}>{team2?.name}</span>
                        </div>
                        <div style={{ height: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                            {renderHeroScore(team2?.value, isTeam2Batting)}
                        </div>
                    </div>
                </div>

                {/* Status / Countdown Box */}
                <CountdownStatusBox match={match} />
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
                                style={{ maxHeight: 36, width: 'auto', height: 'auto', borderRadius: 8 }}
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
