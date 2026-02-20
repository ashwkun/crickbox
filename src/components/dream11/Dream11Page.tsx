/**
 * Dream 11 Page — Match List
 * Shows upcoming + live ICC Men's T20 World Cup matches
 * Click a match → navigates to prediction detail
 */

import React from 'react';
import { Match } from '../../types';
import '../../styles/dream11.css';

interface Dream11PageProps {
    matches: Match[];
    onMatchClick: (match: Match) => void;
    onPlayground?: () => void;
    isVisible: boolean;
}

export default function Dream11Page({ matches, onMatchClick, onPlayground, isVisible }: Dream11PageProps) {
    // Filter T20 WC matches
    const t20wcMatches = matches.filter(m => {
        const raw = m as any;
        const series = (raw.parent_series_name || m.series_name || '').toLowerCase();
        return series.includes('world twenty20') || series.includes('t20 world cup');
    });

    // Separate by state
    const liveMatches = t20wcMatches.filter(m => m.event_state === 'L');
    const upcomingMatches = t20wcMatches.filter(m => m.event_state === 'U');
    const recentMatches = t20wcMatches
        .filter(m => m.event_state === 'R' || m.event_state === 'C')
        .slice(0, 5);

    if (!isVisible) return null;

    return (
        <div className="dr11-page">
            <div className="dr11-header">
                <div className="dr11-header-badge">D11</div>
                <div>
                    <h1 className="dr11-title">Dream 11 Predictor</h1>
                    <p className="dr11-subtitle">ICC Men's T20 World Cup 2026</p>
                </div>
                {onPlayground && (
                    <button className="dr11-playground-btn" onClick={onPlayground}>🧪 Playground</button>
                )}
            </div>

            {/* Live Matches */}
            {liveMatches.length > 0 && (
                <div className="dr11-match-section">
                    <h2 className="dr11-section-title">
                        <span className="live-dot" /> Live Now
                    </h2>
                    {liveMatches.map(m => (
                        <MatchCard key={m.game_id} match={m} onClick={() => onMatchClick(m)} isLive />
                    ))}
                </div>
            )}

            {/* Upcoming Matches */}
            {upcomingMatches.length > 0 && (
                <div className="dr11-match-section">
                    <h2 className="dr11-section-title">Upcoming</h2>
                    {upcomingMatches.map(m => (
                        <MatchCard key={m.game_id} match={m} onClick={() => onMatchClick(m)} />
                    ))}
                </div>
            )}

            {/* Recent Results */}
            {recentMatches.length > 0 && (
                <div className="dr11-match-section">
                    <h2 className="dr11-section-title">Recent Results</h2>
                    {recentMatches.map(m => (
                        <MatchCard key={m.game_id} match={m} onClick={() => onMatchClick(m)} isResult />
                    ))}
                </div>
            )}

            {t20wcMatches.length === 0 && (
                <div className="dr11-empty">
                    <p>No T20 World Cup matches found.</p>
                    <p className="dr11-empty-hint">Matches will appear here when the schedule is available.</p>
                </div>
            )}
        </div>
    );
}

// ============ Match Card Sub-Component ============

function MatchCard({ match, onClick, isLive, isResult }: {
    match: Match;
    onClick: () => void;
    isLive?: boolean;
    isResult?: boolean;
}) {
    const team1 = match.participants?.[0];
    const team2 = match.participants?.[1];

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        } catch { return dateStr; }
    };

    return (
        <div className={`dr11-match-card ${isLive ? 'dr11-match-card--live' : ''} ${isResult ? 'dr11-match-card--result' : ''}`} onClick={onClick}>
            <div className="dr11-match-card-teams">
                <div className="dr11-team">
                    <span className="dr11-team-name">{team1?.short_name || team1?.name || '?'}</span>
                    {isLive && team1?.value && (
                        <span className="dr11-team-score">{team1.value}</span>
                    )}
                    {isResult && team1?.value && (
                        <span className="dr11-team-score dr11-team-score--result">{team1.value}</span>
                    )}
                </div>
                <div className="dr11-vs">
                    {isLive ? (
                        <span className="dr11-vs-live"><span className="live-dot" /> LIVE</span>
                    ) : (
                        <span>vs</span>
                    )}
                </div>
                <div className="dr11-team">
                    <span className="dr11-team-name">{team2?.short_name || team2?.name || '?'}</span>
                    {isLive && team2?.value && (
                        <span className="dr11-team-score">{team2.value}</span>
                    )}
                    {isResult && team2?.value && (
                        <span className="dr11-team-score dr11-team-score--result">{team2.value}</span>
                    )}
                </div>
            </div>
            <div className="dr11-match-card-footer">
                <span className="dr11-match-meta">{match.short_event_status || formatDate(match.start_date)}</span>
                <span className="dr11-match-cta">
                    {isResult ? 'View Prediction →' : 'Predict →'}
                </span>
            </div>
        </div>
    );
}
