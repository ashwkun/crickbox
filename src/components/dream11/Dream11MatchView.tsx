/**
 * Dream 11 Match View — Prediction Detail
 * Shows full prediction with every decision-making point visible
 */

import React, { useState, useEffect } from 'react';
import { Match } from '../../types';
import { predictDream11, Dream11Prediction, PlayerScore, D11Role } from '../../utils/dream11Predictor';
import '../../styles/dream11.css';

interface Dream11MatchViewProps {
    match: Match;
    onBack: () => void;
    isVisible: boolean;
}

export default function Dream11MatchView({ match, onBack, isVisible }: Dream11MatchViewProps) {
    const [prediction, setPrediction] = useState<Dream11Prediction | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
    const [showBench, setShowBench] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [activeTab, setActiveTab] = useState<'team' | 'all'>('team');

    useEffect(() => {
        if (!match?.game_id || !isVisible) return;
        setLoading(true);
        predictDream11(match.game_id).then(pred => {
            setPrediction(pred);
            setLoading(false);
        });
    }, [match?.game_id, isVisible]);

    if (!isVisible) return null;

    const togglePlayer = (id: string) => {
        setExpandedPlayers(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (loading) {
        return (
            <div className="dr11-page">
                <div className="dr11-loading">
                    <div className="dr11-loading-spinner" />
                    <p>Analyzing players...</p>
                    <p className="dr11-loading-sub">Fetching scorecard, H2H rankings, and tournament form from Supabase</p>
                </div>
            </div>
        );
    }

    if (!prediction || prediction.error) {
        return (
            <div className="dr11-page">
                <div className="dr11-error">
                    <h2>Prediction Failed</h2>
                    <p>{prediction?.error || 'Unknown error'}</p>
                    {prediction?.logs && (
                        <div className="dr11-logs">
                            {prediction.logs.map((log, i) => <div key={i} className="dr11-log-line">{log}</div>)}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const { team1, team2, venue, pitchType, selectedTeam, backups, captain, viceCaptain, allPlayers, logs } = prediction;
    const benchPlayers = allPlayers.filter(p => !p.selected && !backups?.includes(p));

    return (
        <div className="dr11-page">
            {/* Match Header */}
            <div className="dr11-match-header">
                <div className="dr11-match-header-teams">
                    <span className="dr11-mh-team">{team1.shortName || team1.name}</span>
                    <span className="dr11-mh-vs">vs</span>
                    <span className="dr11-mh-team">{team2.shortName || team2.name}</span>
                </div>
                <div className="dr11-match-header-meta">
                    <span>📍 {venue}</span>
                    <span>🏏 Pitch: <strong>{pitchType}</strong></span>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="dr11-tabs">
                <button
                    className={`dr11-tab ${activeTab === 'team' ? 'dr11-tab--active' : ''}`}
                    onClick={() => setActiveTab('team')}
                >
                    🏆 Dream 11
                </button>
                <button
                    className={`dr11-tab ${activeTab === 'all' ? 'dr11-tab--active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    📊 All Players ({allPlayers.length})
                </button>
            </div>

            {activeTab === 'team' ? (
                <>
                    {/* Selected Team */}
                    <div className="dr11-section">
                        <h2 className="dr11-section-title">Suggested Dream 11</h2>
                        <div className="dr11-team-grid">
                            {selectedTeam
                                .sort((a, b) => {
                                    // Sort: C first, VC second, then by role group, then by score
                                    if (a.isCaptain) return -1;
                                    if (b.isCaptain) return 1;
                                    if (a.isViceCaptain) return -1;
                                    if (b.isViceCaptain) return 1;
                                    const roleOrder: Record<D11Role, number> = { WK: 0, BAT: 1, AR: 2, BOWL: 3 };
                                    if (roleOrder[a.role] !== roleOrder[b.role]) return roleOrder[a.role] - roleOrder[b.role];
                                    return b.totalScore - a.totalScore;
                                })
                                .map(player => (
                                    <PlayerCard
                                        key={player.playerId}
                                        player={player}
                                        expanded={expandedPlayers.has(player.playerId)}
                                        onToggle={() => togglePlayer(player.playerId)}
                                    />
                                ))}
                        </div>
                    </div>

                    {/* Team Composition Summary */}
                    <div className="dr11-composition">
                        <CompositionBadge role="WK" count={selectedTeam.filter(p => p.role === 'WK').length} />
                        <CompositionBadge role="BAT" count={selectedTeam.filter(p => p.role === 'BAT').length} />
                        <CompositionBadge role="AR" count={selectedTeam.filter(p => p.role === 'AR').length} />
                        <CompositionBadge role="BOWL" count={selectedTeam.filter(p => p.role === 'BOWL').length} />
                        <div className="dr11-comp-divider" />
                        <span className="dr11-comp-team-split">
                            {team1.shortName}: {selectedTeam.filter(p => p.teamId === team1.id).length} |
                            {' '}{team2.shortName}: {selectedTeam.filter(p => p.teamId === team2.id).length}
                        </span>
                    </div>

                    {/* Backups */}
                    {backups && backups.length > 0 && (
                        <div className="dr11-section">
                            <h2 className="dr11-section-title">🔄 Backups (in order)</h2>
                            <div className="dr11-team-grid">
                                {backups.map((player, idx) => (
                                    <PlayerCard
                                        key={player.playerId}
                                        player={player}
                                        expanded={expandedPlayers.has(player.playerId)}
                                        onToggle={() => togglePlayer(player.playerId)}
                                        backupNum={idx + 1}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bench */}
                    <div className="dr11-section">
                        <h2
                            className="dr11-section-title dr11-section-title--clickable"
                            onClick={() => setShowBench(!showBench)}
                        >
                            ❌ Not Selected ({benchPlayers.length})
                            <span className="dr11-chevron">{showBench ? '▲' : '▼'}</span>
                        </h2>
                        {showBench && (
                            <div className="dr11-team-grid">
                                {benchPlayers.map(player => (
                                    <PlayerCard
                                        key={player.playerId}
                                        player={player}
                                        expanded={expandedPlayers.has(player.playerId)}
                                        onToggle={() => togglePlayer(player.playerId)}
                                        isBench
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* All Players Tab */
                <div className="dr11-section">
                    <h2 className="dr11-section-title">All Players Ranked</h2>
                    <div className="dr11-team-grid">
                        {allPlayers.map((player, idx) => (
                            <PlayerCard
                                key={player.playerId}
                                player={player}
                                expanded={expandedPlayers.has(player.playerId)}
                                onToggle={() => togglePlayer(player.playerId)}
                                rank={idx + 1}
                                isBench={!player.selected}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Decision Log */}
            <div className="dr11-section">
                <h2
                    className="dr11-section-title dr11-section-title--clickable"
                    onClick={() => setShowLogs(!showLogs)}
                >
                    🔍 Decision Log ({logs.length} steps)
                    <span
                        className="dr11-copy-btn"
                        title="Copy logs"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(logs.join('\n'));
                            const btn = e.currentTarget;
                            btn.textContent = '✓';
                            setTimeout(() => { btn.textContent = '📋'; }, 1500);
                        }}
                    >📋</span>
                    <span className="dr11-chevron">{showLogs ? '▲' : '▼'}</span>
                </h2>
                {showLogs && (
                    <div className="dr11-logs">
                        {logs.map((log, i) => (
                            <div key={i} className={`dr11-log-line ${log.startsWith('---') ? 'dr11-log-line--header' : ''} ${log.startsWith('ERROR') ? 'dr11-log-line--error' : ''}`}>
                                <span className="dr11-log-num">{i + 1}</span>
                                {log}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============ Sub-Components ============

function CompositionBadge({ role, count }: { role: D11Role; count: number }) {
    const colors: Record<D11Role, string> = {
        WK: '#f59e0b',
        BAT: '#3b82f6',
        AR: '#22c55e',
        BOWL: '#ef4444',
    };
    return (
        <div className="dr11-comp-badge" style={{ borderColor: colors[role] }}>
            <span className="dr11-comp-badge-role" style={{ color: colors[role] }}>{role}</span>
            <span className="dr11-comp-badge-count">{count}</span>
        </div>
    );
}

function PlayerCard({ player, expanded, onToggle, isBench, rank, backupNum }: {
    player: PlayerScore;
    expanded: boolean;
    onToggle: () => void;
    isBench?: boolean;
    rank?: number;
    backupNum?: number;
}) {
    const roleColors: Record<D11Role, string> = {
        WK: '#f59e0b',
        BAT: '#3b82f6',
        AR: '#22c55e',
        BOWL: '#ef4444',
    };

    const { tournamentForm: tf, careerStats: cs, iccRanking: ir, roleValue: rv, pitchFit: pf } = player;

    return (
        <div className={`dr11-player-card ${isBench ? 'dr11-player-card--bench' : ''} ${backupNum ? 'dr11-player-card--backup' : ''} ${player.isCaptain ? 'dr11-player-card--captain' : ''} ${player.isViceCaptain ? 'dr11-player-card--vc' : ''}`}>
            {/* Header Row */}
            <div className="dr11-player-header" onClick={onToggle}>
                <div className="dr11-player-left">
                    {rank && <span className="dr11-player-rank">#{rank}</span>}
                    {backupNum && <span className="dr11-badge dr11-badge--backup">B{backupNum}</span>}
                    {player.isCaptain && <span className="dr11-badge dr11-badge--captain">C</span>}
                    {player.isViceCaptain && <span className="dr11-badge dr11-badge--vc">VC</span>}
                    <span className="dr11-player-name">{player.name}</span>
                    <span className="dr11-player-team-tag">{player.team}</span>
                </div>
                <div className="dr11-player-right">
                    <span className="dr11-role-badge" style={{ background: roleColors[player.role] + '22', color: roleColors[player.role], borderColor: roleColors[player.role] + '44' }}>
                        {player.role}
                    </span>
                    <span className="dr11-player-score">{player.totalScore.toFixed(1)}</span>
                    <span className="dr11-chevron-sm">{expanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {/* Score Bar */}
            <div className="dr11-score-bar-container">
                <div className="dr11-score-bar">
                    <div className="dr11-score-bar-segment dr11-score-bar--form" style={{ width: `${tf.score * 0.30}%` }} title={`Form: ${tf.score}`} />
                    <div className="dr11-score-bar-segment dr11-score-bar--career" style={{ width: `${cs.score * 0.20}%` }} title={`Career: ${cs.score}`} />
                    <div className="dr11-score-bar-segment dr11-score-bar--icc" style={{ width: `${ir.score * 0.20}%` }} title={`ICC: ${ir.score}`} />
                    <div className="dr11-score-bar-segment dr11-score-bar--role" style={{ width: `${rv.score * 0.15}%` }} title={`Role: ${rv.score}`} />
                    <div className="dr11-score-bar-segment dr11-score-bar--pitch" style={{ width: `${pf.score * 0.15}%` }} title={`Pitch: ${pf.score}`} />
                </div>
            </div>

            {/* Expanded Breakdown */}
            {expanded && (
                <div className="dr11-breakdown">
                    {/* Tournament Form */}
                    <SignalSection
                        title="Tournament Form"
                        signal="form"
                        score={tf.score}
                        weight={30}
                        weighted={+(tf.score * 0.30).toFixed(1)}
                    >
                        <div className="dr11-signal-detail">
                            <p className="dr11-signal-reasoning">{tf.reasoning}</p>
                            {tf.batting.innings > 0 && (
                                <div className="dr11-stat-row">
                                    <span>🏏 Batting: {tf.batting.innings} inn</span>
                                    <span>Avg {tf.batting.avgRuns} runs</span>
                                    <span>SR {tf.batting.avgSR}</span>
                                    <span>Boundary {tf.batting.boundaryPct}%</span>
                                </div>
                            )}
                            {tf.bowling.innings > 0 && (
                                <div className="dr11-stat-row">
                                    <span>🎯 Bowling: {tf.bowling.innings} inn</span>
                                    <span>Avg {tf.bowling.avgWickets}w</span>
                                    <span>Eco {tf.bowling.avgEco}</span>
                                    <span>Dots {tf.bowling.dotPct}%</span>
                                </div>
                            )}
                            {tf.matchByMatch.length > 0 && (
                                <div className="dr11-match-history">
                                    <p className="dr11-mh-label">Match-by-Match:</p>
                                    {tf.matchByMatch.map((m, i) => (
                                        <div key={i} className="dr11-mh-row">
                                            <span className="dr11-mh-date">{m.date ? new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</span>
                                            {m.runs !== undefined && (
                                                <span className="dr11-mh-stat">
                                                    {m.runs}{m.balls ? `(${m.balls})` : ''} @ {m.sr?.toFixed(0) || '—'}
                                                </span>
                                            )}
                                            {m.wickets !== undefined && (
                                                <span className="dr11-mh-stat dr11-mh-stat--bowl">
                                                    {m.wickets}/{m.bowlingRuns || 0} ({m.overs || '—'}ov)
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {tf.batting.innings === 0 && tf.bowling.innings === 0 && (
                                <p className="dr11-no-data">No tournament data available yet</p>
                            )}
                        </div>
                    </SignalSection>

                    {/* Career Stats */}
                    <SignalSection
                        title="Career Stats"
                        signal="career"
                        score={cs.score}
                        weight={20}
                        weighted={+(cs.score * 0.20).toFixed(1)}
                    >
                        <div className="dr11-signal-detail">
                            <p className="dr11-signal-reasoning">{cs.reasoning}</p>
                            <div className="dr11-stat-row">
                                <span>Bat Avg: {cs.battingAvg}</span>
                                <span>SR: {cs.battingSR}</span>
                                <span>Runs: {cs.totalRuns}</span>
                            </div>
                            {cs.totalWickets > 0 && (
                                <div className="dr11-stat-row">
                                    <span>Bowl Eco: {cs.bowlingEco}</span>
                                    <span>Wickets: {cs.totalWickets}</span>
                                </div>
                            )}
                            <div className="dr11-stat-row">
                                <span>{cs.matches} matches played</span>
                            </div>
                        </div>
                    </SignalSection>

                    {/* ICC Ranking */}
                    <SignalSection
                        title="ICC Ranking"
                        signal="icc"
                        score={ir.score}
                        weight={20}
                        weighted={+(ir.score * 0.20).toFixed(1)}
                    >
                        <div className="dr11-signal-detail">
                            <p className="dr11-signal-reasoning">{ir.reasoning}</p>
                            {ir.rank && <p className="dr11-rank-display">#{ir.rank}</p>}
                        </div>
                    </SignalSection>

                    {/* Role Value */}
                    <SignalSection
                        title="Role Value"
                        signal="role"
                        score={rv.score}
                        weight={15}
                        weighted={+(rv.score * 0.15).toFixed(1)}
                    >
                        <div className="dr11-signal-detail">
                            <p className="dr11-signal-reasoning">{rv.reasoning}</p>
                            <div className="dr11-stat-row">
                                <span>Role: {rv.skillName}</span>
                                <span>Multiplier: {rv.multiplier.toFixed(2)}×</span>
                            </div>
                        </div>
                    </SignalSection>

                    {/* Pitch Fit */}
                    <SignalSection
                        title="Pitch Fit"
                        signal="pitch"
                        score={pf.score}
                        weight={15}
                        weighted={+(pf.score * 0.15).toFixed(1)}
                    >
                        <div className="dr11-signal-detail">
                            <p className="dr11-signal-reasoning">{pf.reasoning}</p>
                            <div className="dr11-stat-row">
                                <span>Pitch: {pf.pitchType}</span>
                                <span>Player type: {pf.playerType}</span>
                                {pf.avgSpeed && <span>Avg speed: {pf.avgSpeed.toFixed(0)} km/h</span>}
                            </div>
                        </div>
                    </SignalSection>
                </div>
            )}
        </div>
    );
}

// ============ Signal Section Component ============

function SignalSection({ title, signal, score, weight, weighted, children }: {
    title: string;
    signal: string;
    score: number;
    weight: number;
    weighted: number;
    children: React.ReactNode;
}) {
    return (
        <div className={`dr11-signal dr11-signal--${signal}`}>
            <div className="dr11-signal-header">
                <span className="dr11-signal-title">{title}</span>
                <span className="dr11-signal-scores">
                    <span className="dr11-signal-raw">{score}/100</span>
                    <span className="dr11-signal-multiply">× {weight}%</span>
                    <span className="dr11-signal-weighted">= {weighted}</span>
                </span>
            </div>
            <div className="dr11-signal-bar-wrap">
                <div className={`dr11-signal-bar dr11-signal-bar--${signal}`} style={{ width: `${score}%` }} />
            </div>
            {children}
        </div>
    );
}
