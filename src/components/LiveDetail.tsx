import React, { useState } from 'react';
import WikiImage from './WikiImage';
import { WallstreamData } from '../utils/wallstreamApi';
import { getTeamColor } from '../utils/teamColors';
import { getMatchStatusConfig } from '../utils/matchStatus';

interface LiveDetailProps {
    match: any;
    scorecard: any;
    wallstream?: WallstreamData | null;
    onClose: () => void;
    onSeriesClick?: (seriesId: string, seriesMatches?: any[]) => void;
}

const LiveDetail: React.FC<LiveDetailProps> = ({ match, scorecard, wallstream, onClose, onSeriesClick }) => {
    const [selectedSquadIdx, setSelectedSquadIdx] = useState(0);
    const [selectedInningsIdx, setSelectedInningsIdx] = useState(0);

    const team1 = match.participants?.[0];
    const team2 = match.participants?.[1];
    const currentStatus = match.event_sub_status || match.event_status || 'Live';

    // Get current innings count from scorecard
    const currentInningsCount = scorecard?.Innings?.length || 1;

    // Get team colors for gradient
    const color1 = getTeamColor(team1?.name) || getTeamColor(team1?.short_name) || '#3b82f6';
    const color2 = getTeamColor(team2?.name) || getTeamColor(team2?.short_name) || '#8b5cf6';

    // Determine which team is currently batting from scorecard
    const currentBattingTeamId = scorecard?.Innings?.length > 0
        ? scorecard.Innings[scorecard.Innings.length - 1]?.Battingteam
        : null;
    const isTeam1Batting = currentBattingTeamId && team1?.id === currentBattingTeamId;
    const isTeam2Batting = currentBattingTeamId && team2?.id === currentBattingTeamId;

    // Get live score from scorecard (fresher than match.participants)
    const getLiveScore = (teamId: string): string | undefined => {
        if (!scorecard?.Innings?.length) return undefined;

        // Find all innings for this team
        const teamInnings = scorecard.Innings.filter((inn: any) => inn.Battingteam === teamId);
        if (teamInnings.length === 0) return undefined;

        // Build score string (e.g., "152/10" or "445/10 & 89/7")
        const scores = teamInnings.map((inn: any) => `${inn.Total}/${inn.Wickets}`);
        return scores.join(' & ');
    };

    // Use scorecard scores if available, otherwise fallback to match data
    const team1Score = getLiveScore(team1?.id) || team1?.value;
    const team2Score = getLiveScore(team2?.id) || team2?.value;

    // Render score handling Test matches (multi-innings)
    // isBatting: true = green (active), false = white (completed)
    const renderScore = (value: string | undefined, isBatting: boolean) => {
        const activeColor = '#22c55e';
        const completedColor = '#fff';
        const scoreColor = isBatting ? activeColor : completedColor;

        if (!value) return <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>-</span>;
        if (value.includes('&')) {
            const parts = value.split('&').map(s => s.trim());
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: scoreColor }}>
                        {parts[1] || parts[0]}
                        {isBatting ? '*' : ''}
                    </span>
                    {parts[1] && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{parts[0]}</span>}
                </div>
            );
        }
        return <span style={{ fontSize: 18, fontWeight: 700, color: scoreColor }}>{value}{isBatting ? '*' : ''}</span>;
    };

    // Ball dot color
    const getBallColor = (ball: string) => {
        const b = ball.toUpperCase();
        if (b === 'W') return '#ef4444'; // Wicket - red
        if (b.includes('B') || b.includes('LB') || b.includes('WD') || b.includes('NB')) return '#eab308'; // Byes/Wides/NoBalls - yellow
        if (b === '6' || b.includes('6')) return '#f97316'; // Six - orange
        if (b === '4' || b.includes('4')) return '#22c55e'; // Four - green
        if (b === '0') return 'rgba(255,255,255,0.2)'; // Dot - dim
        return '#60a5fa'; // Other runs - blue
    };

    // Format ball display (W shows as W, byes as 4B not 4(4B))
    const getBallDisplay = (ball: string) => {
        const b = ball.toUpperCase();
        // Wicket - just show W
        if (b === 'W' || b === '0W') return 'W';
        // Already nicely formatted (like 4B, 1LB, 1WD, 1NB)
        if (b.includes('B') || b.includes('LB') || b.includes('WD') || b.includes('NB')) {
            // Remove redundant formats like "4(4B)" -> "4B"
            const match = b.match(/(\d+)(B|LB|WD|NB)/);
            if (match) return `${match[1]}${match[2]}`;
        }
        return ball;
    };

    const latestBall = wallstream?.latestBall;

    // Hero Card with subtle team color ambiance (same as UpcomingDetail)
    const heroStyle: React.CSSProperties = {
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0f0f14',
        backgroundImage: `
            radial-gradient(ellipse 50% 60% at 10% 50%, ${color1}25 0%, transparent 100%),
            radial-gradient(ellipse 50% 60% at 90% 50%, ${color2}25 0%, transparent 100%)
        `,
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        marginBottom: '20px',
    };

    return (
        <div className="upcoming-detail">
            {/* Hero Card - Same structure as UpcomingDetail */}
            <div className="upcoming-hero" style={heroStyle}>
                {/* Row 1: Series/Tour name - centered, clickable */}
                <div
                    onClick={() => {
                        if (onSeriesClick) {
                            onSeriesClick(match.series_id, undefined);
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
                    }}>
                        {match.series_name}
                    </span>
                    {onSeriesClick && <span style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.4)' }}>›</span>}
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
                            {match.event_format?.toUpperCase() || ''} {match.event_name.match(/\d+/)?.[0] || ''}{scorecard?.Series_match_count ? `/${scorecard.Series_match_count}` : ''}
                        </span>
                    )}
                </div>

                <div className="upcoming-teams">
                    {/* Team 1 */}
                    <div className="upcoming-team">
                        <WikiImage
                            name={team1?.name}
                            id={team1?.id}
                            type="team"
                            className="team-logo-hero"
                            style={{ width: 60, height: 60, objectFit: 'contain' }}
                        />
                        <span className="upcoming-team-name left">{team1?.name}</span>
                        <div style={{ marginTop: 4 }}>{renderScore(team1Score, isTeam1Batting)}</div>
                    </div>

                    {/* VS */}
                    <div className="upcoming-vs">
                        <span className="vs-text">VS</span>
                    </div>

                    {/* Team 2 */}
                    <div className="upcoming-team right-align">
                        <WikiImage
                            name={team2?.name}
                            id={team2?.id}
                            type="team"
                            className="team-logo-hero"
                            style={{ width: 60, height: 60, objectFit: 'contain' }}
                        />
                        <span className="upcoming-team-name right">{team2?.name}</span>
                        <div style={{ marginTop: 4 }}>{renderScore(team2Score, isTeam2Batting)}</div>
                    </div>
                </div>
            </div>

            {/* Match Status */}
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
                border: '1px solid var(--border-color)',
                textAlign: 'center',
            }}>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{currentStatus}</span>
            </div>

            {/* Live Situation Panel */}
            {latestBall && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 16,
                    padding: '16px 20px',
                    marginBottom: 16,
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>Striker</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>{latestBall.batsmanName}</div>
                            <div style={{ fontSize: 12, color: '#fff', fontFamily: 'monospace' }}>
                                {latestBall.batsmanRuns} ({latestBall.batsmanBalls})
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>
                                    {latestBall.batsmanFours}x4 {latestBall.batsmanSixes}x6
                                </span>
                            </div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'right' }}>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>Non-Striker</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{latestBall.nonStrikerName}</div>
                            <div style={{ fontSize: 12, color: '#fff', fontFamily: 'monospace' }}>
                                {latestBall.nonStrikerRuns} ({latestBall.nonStrikerBalls})
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>Bowler</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{latestBall.bowlerName}</div>
                            <div style={{ fontSize: 12, color: '#fff', fontFamily: 'monospace' }}>
                                {latestBall.bowlerOvers}-{latestBall.bowlerMaidens}-{latestBall.bowlerRuns}-{latestBall.bowlerWickets}
                            </div>
                        </div>
                    </div>

                    {latestBall.thisOver.length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>This Over</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {latestBall.thisOver.map((ball, idx) => (
                                    <div key={idx} style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: getBallColor(ball),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 700, color: '#fff',
                                    }}>
                                        {getBallDisplay(ball)}
                                    </div>
                                ))}
                                {Array(6 - latestBall.thisOver.length).fill(null).map((_, idx) => (
                                    <div key={`e-${idx}`} style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.1)',
                                    }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!wallstream && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid var(--border-color)' }}>
                    <div className="skeleton" style={{ height: 80, borderRadius: 8 }} />
                </div>
            )}

            {/* Commentary */}
            {wallstream && wallstream.balls.length > 0 && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Ball-by-Ball</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 200, overflowY: 'auto' }}>
                        {wallstream.balls.slice(0, 6).map((ball, idx) => {
                            // Determine display text and color based on ball result
                            let resultText = `${ball.runs} run${ball.runs !== '1' ? 's' : ''}`;
                            let resultColor = '#22c55e';
                            let bgColor = 'rgba(255,255,255,0.1)';

                            if (ball.isWicket) {
                                resultText = 'WICKET';
                                resultColor = '#ef4444';
                                bgColor = 'rgba(239, 68, 68, 0.15)';
                            } else if (ball.isSix) {
                                resultText = 'SIX';
                                resultColor = '#f97316';
                                bgColor = 'rgba(249, 115, 22, 0.15)';
                            } else if (ball.isFour) {
                                resultText = 'FOUR';
                                resultColor = '#22c55e';
                                bgColor = 'rgba(34, 197, 94, 0.15)';
                            }

                            return (
                                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 10, borderRadius: 8, background: bgColor }}>
                                    <div style={{ minWidth: 40, height: 26, borderRadius: 6, background: ball.isWicket ? '#ef4444' : ball.isSix ? '#f97316' : ball.isFour ? '#22c55e' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                                        {ball.over}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, color: '#fff', marginBottom: 2 }}>
                                            <span style={{ fontWeight: 600 }}>{ball.bowlerName}</span> to <span style={{ fontWeight: 600 }}>{ball.batsmanName}</span>
                                            <span style={{ color: resultColor, marginLeft: 8, fontWeight: 700 }}>{resultText}</span>
                                        </div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{ball.commentary}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Full Scorecard with Innings Tabs */}
            {scorecard?.Innings && scorecard.Innings.length > 0 ? (() => {
                const innings = scorecard.Innings;
                const selectedInn = innings[selectedInningsIdx];
                if (!selectedInn) return null;

                // Get innings tab labels (e.g., "AUS 1", "ENG 1")
                const getInningsLabel = (inn: any, idx: number) => {
                    const teamName = scorecard.Teams?.[inn.Battingteam]?.Name_Short || 'Team';
                    const inningsNum = Math.floor(idx / 2) + 1;
                    return `${teamName} ${inningsNum}`;
                };

                return (
                    <div style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: 16 }}>
                        {/* Innings Tabs */}
                        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {innings.map((inn: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedInningsIdx(idx)}
                                    style={{
                                        flex: 1,
                                        minWidth: 70,
                                        padding: '12px 16px',
                                        border: 'none',
                                        background: selectedInningsIdx === idx ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                                        borderBottom: selectedInningsIdx === idx ? '2px solid #22c55e' : '2px solid transparent',
                                        color: selectedInningsIdx === idx ? '#22c55e' : 'rgba(255,255,255,0.6)',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {getInningsLabel(inn, idx)}
                                </button>
                            ))}
                        </div>

                        {/* Selected Innings Header */}
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontWeight: 700, color: '#fff' }}>{scorecard.Teams?.[selectedInn.Battingteam]?.Name_Full}</span>
                            <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                                {selectedInn.Total}/{selectedInn.Wickets} <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.8 }}>({selectedInn.Overs} ov)</span>
                            </span>
                        </div>

                        {/* Batting Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', width: '50%' }}>Batter</th>
                                        <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>R</th>
                                        <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>B</th>
                                        <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>4s</th>
                                        <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>6s</th>
                                        <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>SR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedInn.Batsmen?.map((bat: any, i: number) => {
                                        const pName = scorecard.Teams?.[selectedInn.Battingteam]?.Players?.[bat.Batsman]?.Name_Full || '';
                                        const isOnCrease = bat.Isonstrike === '1' || bat.Isnonstriker === '1';
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', ...(isOnCrease ? { background: 'rgba(34, 197, 94, 0.1)' } : {}) }}>
                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <WikiImage name={pName} id={bat.Batsman} type="player" style={{ width: 32, height: 32 }} circle={true} />
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>
                                                                {pName}
                                                                {bat.Isonstrike === '1' && <span style={{ color: '#22c55e', marginLeft: 4 }}>*</span>}
                                                            </div>
                                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{bat.Howout_short || 'batting'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bat.Runs}</td>
                                                <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bat.Balls}</td>
                                                <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bat.Fours}</td>
                                                <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bat.Sixes}</td>
                                                <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bat.Strikerate}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <h4 style={{ margin: '20px 16px 8px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Bowling</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', width: '50%' }}>Bowler</th>
                                        <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>O</th>
                                        <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>M</th>
                                        <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>R</th>
                                        <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>W</th>
                                        <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>ER</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedInn.Bowlers?.map((bowl: any, i: number) => {
                                        const pName = scorecard.Teams?.[selectedInn.Bowlingteam]?.Players?.[bowl.Bowler]?.Name_Full;
                                        const isBowling = bowl.Isbowlingtandem === '1';
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', ...(isBowling ? { background: 'rgba(34, 197, 94, 0.1)' } : {}) }}>
                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <WikiImage name={pName} id={bowl.Bowler} type="player" style={{ width: 32, height: 32 }} circle={true} />
                                                        <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>
                                                            {pName}
                                                            {isBowling && <span style={{ color: '#22c55e', marginLeft: 4 }}>*</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bowl.Overs}</td>
                                                <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bowl.Maidens}</td>
                                                <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bowl.Runs}</td>
                                                <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bowl.Wickets}</td>
                                                <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bowl.Economyrate}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })() : (
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', border: '1px solid var(--border-color)' }}>
                    Loading detailed scorecard...
                </div>
            )}


            {/* Best Performers */}
            {scorecard?.Innings?.[0]?.Best_Performers && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Best Performers</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {/* Top Batsman */}
                        {scorecard.Innings[0].Best_Performers?.Batsmen?.[0] && (() => {
                            const bat = scorecard.Innings[0].Best_Performers.Batsmen[0];
                            return (
                                <div style={{ flex: 1, background: 'rgba(34, 197, 94, 0.1)', borderRadius: 12, padding: 12, border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                    <div style={{ fontSize: 10, color: '#22c55e', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>Top Scorer</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <WikiImage name={bat.Player_Name} id={bat.Player_Id} type="player" style={{ width: 36, height: 36 }} circle={true} />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{bat.Player_Name}</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e', fontFamily: 'monospace' }}>
                                                {bat.Runs}<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}> ({bat.Balls})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                        {/* Top Bowler */}
                        {scorecard.Innings[0].Best_Performers?.Bowlers?.[0] && (() => {
                            const bowl = scorecard.Innings[0].Best_Performers.Bowlers[0];
                            return (
                                <div style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, padding: 12, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <div style={{ fontSize: 10, color: '#ef4444', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>Top Bowler</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <WikiImage name={bowl.Player_Name} id={bowl.Player_Id} type="player" style={{ width: 36, height: 36 }} circle={true} />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{bowl.Player_Name}</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>
                                                {bowl.Wickets}/{bowl.Runs}<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}> ({bowl.Overs})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Current Partnership */}
            {scorecard?.Innings?.[scorecard.Innings.length - 1]?.Partnership_Current && (() => {
                const curr = scorecard.Innings[scorecard.Innings.length - 1].Partnership_Current;
                if (!curr.Batsmen || curr.Batsmen.length < 2) return null;
                const bat1 = curr.Batsmen[0];
                const bat2 = curr.Batsmen[1];
                return (
                    <div style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, textTransform: 'uppercase' }}>Current Partnership</span>
                            <span style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', fontFamily: 'monospace' }}>{curr.Runs} <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>({curr.Balls} balls)</span></span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <WikiImage name={bat1.name || scorecard.Teams?.[scorecard.Innings[scorecard.Innings.length - 1].Battingteam]?.Players?.[bat1.Batsman]?.Name_Full} id={bat1.Batsman} type="player" style={{ width: 28, height: 28 }} circle={true} />
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{bat1.name || scorecard.Teams?.[scorecard.Innings[scorecard.Innings.length - 1].Battingteam]?.Players?.[bat1.Batsman]?.Name_Full}</div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{bat1.Runs} ({bat1.Balls})</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'right' }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{bat2.name || scorecard.Teams?.[scorecard.Innings[scorecard.Innings.length - 1].Battingteam]?.Players?.[bat2.Batsman]?.Name_Full}</div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{bat2.Runs} ({bat2.Balls})</div>
                                </div>
                                <WikiImage name={bat2.name || scorecard.Teams?.[scorecard.Innings[scorecard.Innings.length - 1].Battingteam]?.Players?.[bat2.Batsman]?.Name_Full} id={bat2.Batsman} type="player" style={{ width: 28, height: 28 }} circle={true} />
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Last Overs Summary */}
            {scorecard?.Innings?.[scorecard.Innings.length - 1]?.LastOvers && (() => {
                const last = scorecard.Innings[scorecard.Innings.length - 1].LastOvers;
                return (
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        {last['5'] && (
                            <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 12, padding: 14, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Last 5 Overs</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{last['5'].Score}/{last['5'].Wicket}</div>
                                <div style={{ fontSize: 11, color: '#22c55e' }}>RR: {last['5'].Runrate}</div>
                            </div>
                        )}
                        {last['10'] && (
                            <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 12, padding: 14, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Last 10 Overs</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{last['10'].Score}/{last['10'].Wicket}</div>
                                <div style={{ fontSize: 11, color: '#22c55e' }}>RR: {last['10'].Runrate}</div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Fall of Wickets */}
            {scorecard?.Innings?.[scorecard.Innings.length - 1]?.FallofWickets?.length > 0 && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Fall of Wickets</div>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                        {scorecard.Innings[scorecard.Innings.length - 1].FallofWickets.map((fow: any, idx: number) => {
                            const playerName = scorecard.Teams?.[scorecard.Innings[scorecard.Innings.length - 1].Battingteam]?.Players?.[fow.Batsman]?.Name_Full || 'Player';
                            return (
                                <div key={idx} style={{ minWidth: 70, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>{fow.Score}</div>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{fow.Overs} ov</div>
                                    <div style={{ fontSize: 10, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playerName.split(' ').pop()}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Partnerships */}
            {scorecard?.Innings?.[scorecard.Innings.length - 1]?.Partnerships?.length > 0 && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Partnerships</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {scorecard.Innings[scorecard.Innings.length - 1].Partnerships.slice(0, 5).map((p: any, idx: number) => {
                            const maxRuns = Math.max(...scorecard.Innings[scorecard.Innings.length - 1].Partnerships.map((x: any) => parseInt(x.Runs) || 0));
                            const barWidth = maxRuns > 0 ? (parseInt(p.Runs) / maxRuns) * 100 : 0;
                            const bat1Name = p.Batsmen?.[0]?.name || scorecard.Teams?.[scorecard.Innings[scorecard.Innings.length - 1].Battingteam]?.Players?.[p.Batsmen?.[0]?.Batsman]?.Name_Full || 'P1';
                            const bat2Name = p.Batsmen?.[1]?.name || scorecard.Teams?.[scorecard.Innings[scorecard.Innings.length - 1].Battingteam]?.Players?.[p.Batsmen?.[1]?.Batsman]?.Name_Full || 'P2';
                            return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 20, fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{p.ForWicket}</div>
                                    <div style={{ flex: 1, position: 'relative', height: 28, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${barWidth}%`, background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)', borderRadius: 6 }} />
                                        <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#fff', whiteSpace: 'nowrap' }}>
                                            {bat1Name.split(' ').pop()} & {bat2Name.split(' ').pop()}
                                        </div>
                                    </div>
                                    <div style={{ minWidth: 50, textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>{p.Runs} <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>({p.Balls})</span></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Extras & Run Rate Summary */}
            {scorecard?.Innings?.[scorecard.Innings.length - 1] && (() => {
                const inn = scorecard.Innings[scorecard.Innings.length - 1];
                const totalExtras = (parseInt(inn.Byes) || 0) + (parseInt(inn.Legbyes) || 0) + (parseInt(inn.Wides) || 0) + (parseInt(inn.Noballs) || 0);
                return (
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 12, padding: 14, border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Extras</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#eab308', fontFamily: 'monospace' }}>{totalExtras}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                                b{inn.Byes || 0} lb{inn.Legbyes || 0} wd{inn.Wides || 0} nb{inn.Noballs || 0}
                            </div>
                        </div>
                        <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 12, padding: 14, border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Run Rate</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace' }}>{inn.Runrate || '0.00'}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                                {inn.Total}/{inn.Wickets} ({inn.Overs} ov)
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* DRS Reviews */}
            {scorecard?.Innings?.[scorecard.Innings.length - 1]?.ReviewDetails?.Reviews?.length > 0 && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>DRS Reviews</span>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Batting: <span style={{ color: '#22c55e', fontWeight: 600 }}>{scorecard.Innings[scorecard.Innings.length - 1].ReviewDetails.Batting_review_count}</span></span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Bowling: <span style={{ color: '#ef4444', fontWeight: 600 }}>{scorecard.Innings[scorecard.Innings.length - 1].ReviewDetails.Bowling_review_count}</span></span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {scorecard.Innings[scorecard.Innings.length - 1].ReviewDetails.Reviews.slice(0, 3).map((rev: any, idx: number) => {
                            const isSuccessful = rev.Review_output === 'Successful';
                            return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: isSuccessful ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: 8, border: `1px solid ${isSuccessful ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isSuccessful ? '#22c55e' : '#ef4444' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11, color: '#fff' }}>Over {rev.Over} • {rev.Review_for}</div>
                                    </div>
                                    <div style={{ fontSize: 10, fontWeight: 600, color: isSuccessful ? '#22c55e' : '#ef4444' }}>{rev.Review_output}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Squads with Selector */}
            {scorecard?.Teams && (() => {
                const teamEntries = Object.entries(scorecard.Teams);
                const selectedTeam = teamEntries[selectedSquadIdx];
                if (!selectedTeam) return null;
                const [, team] = selectedTeam as [string, any];

                return (
                    <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 20px', marginTop: 16, border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            {teamEntries.map(([tId, t]: [string, any], idx) => (
                                <button
                                    key={tId}
                                    onClick={() => setSelectedSquadIdx(idx)}
                                    style={{
                                        flex: 1,
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: 'none',
                                        background: selectedSquadIdx === idx ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                                        color: selectedSquadIdx === idx ? '#22c55e' : 'rgba(255,255,255,0.6)',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {t.Name_Short || t.Name_Full}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {team.Players && Object.entries(team.Players)
                                .sort((a: any, b: any) => parseInt(a[1].Position || '99') - parseInt(b[1].Position || '99'))
                                .slice(0, 11)
                                .map(([playerId, player]: [string, any]) => (
                                    <div key={playerId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <WikiImage name={player.Name_Full} id={playerId} type="player" style={{ width: 32, height: 32 }} circle={true} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
                                                {player.Name_Full}
                                                {player.Iscaptain && <span style={{ color: '#22c55e', marginLeft: 6, fontSize: 10 }}>C</span>}
                                                {player.Iskeeper && <span style={{ color: '#60a5fa', marginLeft: 6, fontSize: 10 }}>WK</span>}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                                            {player.Role || player.Skill_Name || ''}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default LiveDetail;
