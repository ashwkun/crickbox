import React from 'react';
import WikiImage from './WikiImage';

const MatchCard = ({ match, onClick, isHero = false }) => {
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

    const renderHeroScore = (score) => {
        if (!score) return '-';

        // Handle multi-innings (Test matches)
        if (score.includes('&')) {
            const parts = score.split('&').map(s => s.trim());
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{parts[1] || parts[0]}</span>
                    {parts[1] && <span style={{ fontSize: 14, color: '#737373' }}>{parts[0]}</span>}
                </div>
            );
        }
        return score;
    };

    if (isHero) {
        return (
            <div className="hero-card" onClick={() => onClick(match)}>
                <div className="hero-label">
                    <span className="live-dot"></span>
                    LIVE
                </div>

                <div className="hero-teams">
                    {match.participants?.map((team, idx) => (
                        <div key={idx} className="hero-team">
                            <div className="hero-team-info">
                                <WikiImage
                                    name={team.name}
                                    id={team.id}
                                    type="team"
                                    className={isHero ? "hero-team-logo" : "match-team-logo"}
                                    style={isHero ? { width: 44, height: 44, borderRadius: 12, objectFit: 'contain' } : { width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }}
                                />
                                <span className="hero-team-name">{team.short_name}</span>
                            </div>
                            <span className="hero-team-score">{renderHeroScore(team.value)}</span>
                        </div>
                    ))}
                </div>

                {match.event_status && (
                    <div className="hero-status">{match.event_status}</div>
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
                        LIVE
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
                                style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }}
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
