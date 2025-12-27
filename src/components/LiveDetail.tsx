import React, { useState, useEffect } from 'react';
import WikiImage, { getFlagUrl } from './WikiImage';
import { WallstreamData } from '../utils/wallstreamApi';
import { getTeamColor } from '../utils/teamColors';
import { getMatchStatusConfig } from '../utils/matchStatus';
import { GiCricketBat } from 'react-icons/gi';
import { IoBaseball } from 'react-icons/io5';
import { fetchHeadToHead, H2HData } from '../utils/h2hApi';

interface LiveDetailProps {
    match: any;
    scorecard: any;
    wallstream?: WallstreamData | null;
    onClose: () => void;
    onSeriesClick?: (seriesId: string, seriesMatches?: any[]) => void;
}

const LiveDetail: React.FC<LiveDetailProps> = ({ match, scorecard, wallstream, onClose, onSeriesClick }) => {
    const [selectedSquadIdx, setSelectedSquadIdx] = React.useState(0);

    // Score Tracking for Animations (State & Ref)
    const prevScores = React.useRef<{ t1: string, t2: string }>({ t1: '', t2: '' });
    const [scoreTicker1, setScoreTicker1] = React.useState<{ text: string, type: 'runs' | 'wicket', key: number } | null>(null);
    const [scoreTicker2, setScoreTicker2] = React.useState<{ text: string, type: 'runs' | 'wicket', key: number } | null>(null);

    const parseScoreSimple = (score: string) => {
        if (!score) return { runs: 0, wickets: 0 };
        // Format: "145/2 (18.4)" or "145" or "145/2"
        const parts = score.split('(')[0].trim().split('/'); // ["145", "2"]
        return {
            runs: parseInt(parts[0]) || 0,
            wickets: parts[1] ? parseInt(parts[1]) : 0
        };
    };

    const [selectedInningsIdx, setSelectedInningsIdx] = useState(0);
    const [commentaryExpanded, setCommentaryExpanded] = useState(false);
    const [h2hData, setH2hData] = useState<H2HData | null>(null);
    const [activeTab, setActiveTab] = useState<'live' | 'insights'>('live');
    const hasSetInitialTab = React.useRef(false);

    // Fetch H2H data for player stats
    useEffect(() => {
        if (match?.game_id) {
            fetchHeadToHead(match.game_id).then(data => {
                if (data) setH2hData(data);
            });
        }
    }, [match?.game_id]);

    // Auto-select the latest inning when data loads
    React.useEffect(() => {
        if (scorecard?.Innings?.length && !hasSetInitialTab.current) {
            setSelectedInningsIdx(scorecard.Innings.length - 1);
            hasSetInitialTab.current = true;
        }
    }, [scorecard]);

    // Helper: Find player in H2H last_n_matches data
    const findPlayerInH2H = (playerName: string, role: 'batsmen' | 'bowler', id?: string): any | null => {
        if (!h2hData?.player?.last_n_matches?.teams) return null;
        for (const team of h2hData.player.last_n_matches.teams) {
            const players = team.top_players?.[role]?.player || [];

            // Priority 1: ID Match
            if (id) {
                const foundById = players.find((p: any) => p.player_id == id || p.id == id);
                if (foundById) return foundById;
            }

            // Priority 2: Name Match (Fallback)
            const foundByName = players.find((p: any) =>
                p.short_name?.toLowerCase() === playerName.toLowerCase() ||
                p.name?.toLowerCase().includes(playerName.toLowerCase()) ||
                playerName.toLowerCase().includes(p.name?.toLowerCase())
            );
            if (foundByName) return foundByName;
        }
        return null;
    };

    // Helper: Find player ID by name from scorecard used for WikiImage
    const findPlayerIdByName = (name: string): string | undefined => {
        if (!scorecard?.Teams) return undefined;
        // Search in all teams
        for (const teamId in scorecard.Teams) {
            const players = scorecard.Teams[teamId].Players;
            if (players) {
                for (const pid in players) {
                    const p = players[pid];
                    // Match full name or partial name if needed
                    if (p.Name_Full === name || p.Name_Full?.includes(name) || name?.includes(p.Name_Full)) {
                        return pid;
                    }
                }
            }
        }
        return undefined;
    };

    // Helper: Find any player name mentioned in text (for commentary parsing)
    const findPlayerNameInText = (text: string): string | undefined => {
        if (!scorecard?.Teams || !text) return undefined;
        let foundName = undefined;
        let longestMatch = 0;

        for (const teamId in scorecard.Teams) {
            const players = scorecard.Teams[teamId].Players;
            if (players) {
                for (const pid in players) {
                    const p = players[pid];
                    const fullName = p.Name_Full;
                    const shortName = p.Name_Short; // e.g. "B Stokes" or "Ben Stokes" if same

                    // Check Full Name
                    if (fullName && text.includes(fullName) && fullName.length > longestMatch) {
                        foundName = fullName;
                        longestMatch = fullName.length;
                    }
                    // Check Short Name (be careful of too short names, ensure min length)
                    else if (shortName && shortName.length > 4 && text.includes(shortName) && shortName.length > longestMatch) {
                        foundName = fullName; // Return full name for display/lookup
                        longestMatch = shortName.length;
                    }
                }
            }
        }
        return foundName;
    };

    // Helper: Calculate recent form stats from H2H matches
    const getRecentForm = (player: any, role: 'batsmen' | 'bowler'): { label: string; value: string } | null => {
        if (!player?.matches?.length) return null;

        if (role === 'batsmen') {
            let totalRuns = 0, innings = 0;
            player.matches.slice(0, 5).forEach((m: any) => {
                if (m.batting?.runs != null) {
                    totalRuns += m.batting.runs;
                    innings += m.batting.innings?.length || 1;
                }
            });
            if (innings === 0) return null;
            const avg = (totalRuns / innings).toFixed(1);
            return { label: `Last ${Math.min(5, player.matches.length)} Matches`, value: `${totalRuns} Runs @ ${avg} Avg` };
        } else {
            let totalWickets = 0, totalRuns = 0, balls = 0;
            player.matches.slice(0, 5).forEach((m: any) => {
                if (m.bowling?.wickets != null) {
                    totalWickets += m.bowling.wickets || 0;
                    totalRuns += m.bowling.runs_given || 0;
                    balls += (parseFloat(m.bowling.overs || '0') * 6);
                }
            });
            if (balls === 0) return null;
            // Calculate Economy instead of Average for better T20 context
            const overs = balls / 6;
            const eco = overs > 0 ? (totalRuns / overs).toFixed(1) : '-';
            return { label: `Last ${Math.min(5, player.matches.length)} Matches`, value: `${totalWickets} Wic @ ${eco} Eco` };
        }
    };

    const getBoundaryStats = (playerName: string | undefined) => {
        if (!playerName || !scorecard?.Innings?.length) return null;

        // Assume current inning is the last one (live)
        const currentInn = scorecard.Innings[scorecard.Innings.length - 1];
        if (!currentInn?.Batsmen) return null;

        // Find matches
        for (const bat of currentInn.Batsmen) {
            const pName = scorecard.Teams?.[currentInn.Battingteam]?.Players?.[bat.Batsman]?.Name_Full;
            const pShortName = scorecard.Teams?.[currentInn.Battingteam]?.Players?.[bat.Batsman]?.Name_Short;

            if ((pName && pName === playerName) || (pShortName && pShortName === playerName) ||
                (pName && playerName.includes(pName)) || (pName && pName.includes(playerName))) {
                return { fours: bat.Fours, sixes: bat.Sixes };
            }
        }
        return null;
    };

    // Helper: Get this over from scorecard (10s poll source)
    // Returns array of strings like ["0", "1LB", "W"]
    const getScorecardThisOver = (): string[] => {
        if (!scorecard?.Innings?.length) return [];
        const currentInn = scorecard.Innings[scorecard.Innings.length - 1];

        // Find the active bowler
        // In scorecard, Bowlers list has "Isbowlingnow" flag usually, or we check last overs
        // Actually, the API structure usually puts "ThisOver" inside the bowler object or innings object
        // Let's check the Bowlers array for "Isbowlingnow": true or similar

        // Strategy: Look for "ThisOver" in the current active bowler
        if (currentInn.Bowlers) {
            for (const b of currentInn.Bowlers) {
                if (b.Isbowlingnow || b.Isbowlingnow === 'true' || b.Isbowlingnow === true) {
                    // Found active bowler
                    if (b.ThisOver && Array.isArray(b.ThisOver)) {
                        // Convert complex objects {T: "lb", B: "1"} to strings if needed
                        // Or if it's already string array
                        return b.ThisOver.map((ball: any) => {
                            if (typeof ball === 'string') return ball;
                            // Handle object format: {T: "lb", B: "1"} -> "1LB"
                            const runs = ball.B || '0';
                            const type = ball.T ? ball.T.toUpperCase() : '';

                            if (type === 'W') return 'W';
                            if (type === 'WD') return `${runs}WD`;
                            if (type === 'LB') return `${runs}LB`;
                            if (type === 'B') return `${runs}B`;
                            if (type === 'NB') return `${runs}NB`;
                            return runs;
                        });
                    }
                }
            }
            // Fallback: use last bowler if no "Isbowlingnow" (rare)
            const lastBowler = currentInn.Bowlers[currentInn.Bowlers.length - 1];
            if (lastBowler?.ThisOver) {
                return lastBowler.ThisOver.map((ball: any) => {
                    if (typeof ball === 'string') return ball;
                    const runs = ball.B || '0';
                    const type = ball.T ? ball.T.toUpperCase() : '';
                    if (type === 'W') return 'W';
                    if (type === 'WD') return `${runs}WD`;
                    if (type === 'LB') return `${runs}LB`;
                    return runs;
                });
            }
        }
        return [];
    };

    const team1 = match.participants?.[0];
    const team2 = match.participants?.[1];
    const currentStatus = scorecard?.Matchdetail?.Equation || match.event_sub_status || match.event_status || 'Live';
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

        // Build score string (e.g., "152/10 (20.0)" or "445/10 (120.0) & 89/7 (30.2)")
        const scores = teamInnings.map((inn: any) => {
            const score = `${inn.Total}/${inn.Wickets}`;
            const overs = inn.Overs ? ` (${inn.Overs})` : '';
            return `${score}${overs}`;
        });
        return scores.join(' & ');
    };

    // Use scorecard scores exclusively for live
    const team1Score = getLiveScore(team1?.id);
    const team2Score = getLiveScore(team2?.id);

    React.useEffect(() => {
        if (!team1Score && !team2Score) return;

        const checkScore = (curr: string, prev: string, setTicker: any) => {
            if (!curr || curr === prev) return;
            // Prevent animation on initial load (when prev is empty)
            if (!prev) return;

            const c = parseScoreSimple(curr);
            const p = parseScoreSimple(prev);

            if (c.wickets > p.wickets) {
                setTicker({ text: 'W', type: 'wicket', key: Date.now() });
            } else if (c.runs > p.runs) {
                const diff = c.runs - p.runs;
                setTicker({ text: `+${diff}`, type: 'runs', key: Date.now() });
            }
        };

        checkScore(team1Score || '', prevScores.current.t1, setScoreTicker1);
        checkScore(team2Score || '', prevScores.current.t2, setScoreTicker2);

        prevScores.current = { t1: team1Score || '', t2: team2Score || '' };
    }, [team1Score, team2Score]);

    // Render score handling Test matches (multi-innings)
    // isBatting: true = green (active), false = white (completed)
    const renderScore = (value: string | undefined, isBatting: boolean) => {
        const activeColor = '#22c55e';
        const completedColor = '#fff';
        const scoreColor = isBatting ? activeColor : completedColor;

        if (!value) return (
            <div style={{ minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>-</span>
            </div>
        );

        if (value.includes('&')) {
            const parts = value.split('&').map(s => s.trim());
            return (
                <div style={{ minHeight: 42, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: scoreColor }}>
                        {parts[1] || parts[0]}
                        {isBatting ? '*' : ''}
                    </span>
                    {parts[1] && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{parts[0]}</span>}
                </div>
            );
        }
        return (
            <div style={{ minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: scoreColor }}>{value}{isBatting ? '*' : ''}</span>
            </div>
        );
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

    // Hybrid Striker Logic:
    // 1. Get rich data from Wallstream (stats, boundaries)
    // 2. Override the *identity* (Name) from Live Matches API which updates faster (between balls/overs)
    let latestBall = wallstream?.latestBall;

    // Find the fast-updating striker from match participants
    // Structure: match.participants[i].players_involved list active batters
    const fastStriker = match.participants?.flatMap((p: any) => p.players_involved || [])
        .find((p: any) => p.name.includes('*'));

    if (latestBall && fastStriker) {
        const fastName = fastStriker.name.replace(' *', '').trim();

        // If the 'Fast' striker is different from 'Wallstream' striker, assume Wallstream is lagging
        // We swap them so the UI shows the correct person facing
        if (latestBall.batsmanName !== fastName && latestBall.nonStrikerName === fastName) {
            // Swap Striker <-> Non-Striker
            const tempName = latestBall.batsmanName;
            const tempRuns = latestBall.batsmanRuns;
            const tempBalls = latestBall.batsmanBalls;
            const temp4s = latestBall.batsmanFours;
            const temp6s = latestBall.batsmanSixes;

            latestBall = {
                ...latestBall,
                batsmanName: latestBall.nonStrikerName,
                batsmanRuns: latestBall.nonStrikerRuns,
                batsmanBalls: latestBall.nonStrikerBalls,
                // Start fresh boundaries for swapped striker or keep cached? 
                // Wallstream doesn't provide non-striker boundaries explicitly in this object usually?
                // Wait, calculating swap for boundaries is risky if data missing.
                // Actually, let's just accept the swap for NAME and RUNS/BALLS which we have.
                batsmanFours: '0', // Fallback as non-striker object often lacks boundary counts in simple feeds
                batsmanSixes: '0',

                nonStrikerName: tempName,
                nonStrikerRuns: tempRuns,
                nonStrikerBalls: tempBalls
            };
        } else if (latestBall.batsmanName !== fastName) {
            // New batsman entirely? (Wicket fell)
            // Rely on Wallstream which has the 'Wicket' event logic. 
            // Only swap if it's the partner taking strike.
        }
    }

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

                    {/* Insights chip - toggles to H2H view */}
                    <span
                        onClick={() => setActiveTab(activeTab === 'live' ? 'insights' : 'live')}
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '6px 12px',
                            background: activeTab === 'insights' ? '#a855f7' : 'rgba(168, 85, 247, 0.15)',
                            borderRadius: 20,
                            color: activeTab === 'insights' ? '#fff' : '#c084fc',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: activeTab === 'insights' ? '1px solid #a855f7' : '1px solid rgba(168, 85, 247, 0.3)',
                            boxShadow: activeTab === 'insights' ? '0 2px 8px rgba(168, 85, 247, 0.4)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                    >
                        {activeTab === 'live' ? 'View Insights' : 'Back to Live'}
                    </span>
                </div>

                <div className="upcoming-teams">
                    {/* Team 1 */}
                    <div className="upcoming-team" style={{ position: 'relative' }}>
                        {scoreTicker1 && (
                            <div key={scoreTicker1.key} className={`score-ticker ${scoreTicker1.type === 'wicket' ? 'ticker-wicket' : 'ticker-runs'}`}>
                                {scoreTicker1.text}
                            </div>
                        )}
                        <WikiImage
                            name={team1?.name}
                            id={team1?.id}
                            type="team"
                            className="team-logo-hero"
                            style={getFlagUrl(team1?.name)
                                ? { width: 60, height: 60, objectFit: 'contain' }
                                : { maxHeight: 60, width: 'auto', height: 'auto' }
                            }
                        />
                        <span className="upcoming-team-name left">{team1?.name}</span>
                        <div style={{ marginTop: 4 }}>{renderScore(team1Score, isTeam1Batting)}</div>
                    </div>

                    {/* VS */}
                    <div className="upcoming-vs">
                        <span className="vs-text">VS</span>
                    </div>

                    {/* Team 2 */}
                    <div className="upcoming-team right-align" style={{ position: 'relative' }}>
                        {scoreTicker2 && (
                            <div key={scoreTicker2.key} className={`score-ticker ${scoreTicker2.type === 'wicket' ? 'ticker-wicket' : 'ticker-runs'}`} style={{ right: 'auto', left: 10 }}>
                                {scoreTicker2.text}
                            </div>
                        )}
                        <WikiImage
                            name={team2?.name}
                            id={team2?.id}
                            type="team"
                            className="team-logo-hero"
                            style={getFlagUrl(team2?.name)
                                ? { width: 60, height: 60, objectFit: 'contain' }
                                : { maxHeight: 60, width: 'auto', height: 'auto' }
                            }
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
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 500, lineHeight: '1.4', display: 'block' }}>{currentStatus}</span>
            </div>

            import LiveInsights from './LiveInsights';

            // ... inside the component ...

            {/* === INSIGHTS VIEW === */}
            {activeTab === 'insights' && h2hData && (
                <LiveInsights h2hData={h2hData} />
            )}

            {/* === LIVE VIEW === */}
            <div style={{ display: activeTab === 'live' ? 'block' : 'none' }}>
                {/* Live Situation Panel */}
                {/* Styles for TV Experience */}
                <style>
                    {`
                @keyframes pulse-glow {
                    0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
                    70% { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                }
                @keyframes float-up-fade {
                    0% { transform: translateY(0) scale(0.8); opacity: 0; }
                    20% { transform: translateY(-10px) scale(1.2); opacity: 1; }
                    100% { transform: translateY(-30px) scale(1); opacity: 0; }
                }
                .score-ticker {
                    position: absolute;
                    top: -10px;
                    right: 10px;
                    font-size: 16px;
                    font-weight: 800;
                    animation: float-up-fade 1.5s ease-out forwards;
                    pointer-events: none;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }
                .ticker-runs { color: #4ade80; }
                .ticker-wicket { color: #ef4444; font-size: 20px; }
                `}
                </style>

                {/* Live Situation Panel */}
                {latestBall && (
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: 16,
                        padding: '20px 20px',
                        marginBottom: 16,
                        position: 'relative',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        overflow: 'hidden'
                    }}>

                        {/* Event Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 10 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>Striker</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>{latestBall?.batsmanName}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                                    {latestBall?.batsmanRuns || '0'}<span style={{ fontSize: 9 }}>({latestBall?.batsmanBalls || '0'})</span>
                                    {(() => {
                                        const stats = getBoundaryStats(latestBall?.batsmanName);
                                        if (stats) return (
                                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>
                                                {stats.fours}x4 {stats.sixes}x6
                                            </span>
                                        );
                                        return null;
                                    })()}
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', minWidth: 60 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    background: (() => {
                                        // Prioritize Scorecard API for this over
                                        const scLimit = getScorecardThisOver();
                                        const thisOverBalls = scLimit.length > 0 ? scLimit : (latestBall?.thisOver || []);

                                        const lastBallVal = thisOverBalls.length > 0
                                            ? thisOverBalls[thisOverBalls.length - 1]
                                            : (latestBall?.detail || latestBall?.runs || '0');
                                        return getBallColor(lastBallVal);
                                    })(),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px',
                                    fontSize: 13, fontWeight: 700, color: '#fff',
                                    animation: 'pulse-glow 2s infinite'
                                }}>
                                    {(() => {
                                        const scLimit = getScorecardThisOver();
                                        const thisOverBalls = scLimit.length > 0 ? scLimit : (latestBall?.thisOver || []);

                                        const lastBallVal = thisOverBalls.length > 0
                                            ? thisOverBalls[thisOverBalls.length - 1]
                                            : (latestBall?.detail || latestBall?.runs || '0');
                                        return getBallDisplay(lastBallVal);
                                    })()}
                                </div>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Last Ball</div>
                            </div>

                            <div style={{ flex: 1, textAlign: 'right' }}>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>Non-Striker</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{latestBall?.nonStrikerName}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                                    {latestBall?.nonStrikerRuns || '0'}<span style={{ fontSize: 9 }}>({latestBall?.nonStrikerBalls || '0'})</span>
                                </div>
                            </div>
                        </div>


                        {/* Run Rates Row */}
                        {scorecard?.Innings?.length > 0 && (() => {
                            const inn = scorecard.Innings[scorecard.Innings.length - 1];
                            const crr = parseFloat(inn.Runrate) || 0;
                            const reviewDetails = inn.ReviewDetails;

                            // Calculate RRR for limited-overs chases
                            let rrr: number | null = null;
                            const matchType = scorecard.Matchdetail?.Match?.Type?.toLowerCase() || '';
                            const isLimitedOvers = matchType.includes('t20') || matchType.includes('odi') || matchType.includes('one-day');

                            if (isLimitedOvers && scorecard.Innings.length >= 2) {
                                // Chase scenario: Current innings is 2nd (or 4th in super over etc.)
                                const targetInnings = scorecard.Innings[scorecard.Innings.length - 2];
                                const target = parseInt(targetInnings.Total) + 1; // Need to beat this
                                const currentScore = parseInt(inn.Total) || 0;
                                const runsNeeded = target - currentScore;
                                const allotedBalls = parseInt(inn.AllotedBalls) || 120; // Default T20
                                const ballsBowled = parseInt(inn.Total_Balls_Bowled) || 0;
                                const ballsRemaining = allotedBalls - ballsBowled;

                                if (runsNeeded > 0 && ballsRemaining > 0) {
                                    rrr = (runsNeeded / ballsRemaining) * 6;
                                }
                            }

                            return (
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    {/* Toss chip - hide during chase (when RRR is shown) */}
                                    {rrr === null && scorecard?.Matchdetail?.Tosswonby && (
                                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <span>Toss:</span>
                                            <span style={{ fontWeight: 700 }}>{scorecard.Teams?.[scorecard.Matchdetail.Tosswonby]?.Name_Short || 'TBD'}</span>
                                            {scorecard.Matchdetail.Toss_elected_to?.toLowerCase() === 'bat' ? (
                                                <GiCricketBat size={11} />
                                            ) : (
                                                <IoBaseball size={10} />
                                            )}
                                        </span>
                                    )}
                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 6 }}>
                                        CRR: <span style={{ color: '#60a5fa', fontWeight: 700 }}>{crr.toFixed(2)}</span>
                                    </span>
                                    {rrr !== null && (
                                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 6 }}>
                                            RRR: <span style={{ color: rrr > crr ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{rrr.toFixed(2)}</span>
                                        </span>
                                    )}
                                    {reviewDetails && (
                                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span>DRS:</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <GiCricketBat size={12} />
                                                <span style={{ fontWeight: 700 }}>{reviewDetails.Batting_review_count ?? 0}</span>
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <IoBaseball size={11} />
                                                <span style={{ fontWeight: 700 }}>{reviewDetails.Bowling_review_count ?? 0}</span>
                                            </span>
                                        </span>
                                    )}
                                </div>
                            );
                        })()}

                        {latestBall.thisOver.length > 0 && (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                    {/* Last 5 Overs */}
                                    <div style={{ textAlign: 'center', minWidth: 70, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Last 5 Ov</div>
                                        {scorecard?.Innings?.[scorecard.Innings.length - 1]?.LastOvers?.['5'] ? (
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'monospace', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {scorecard.Innings[scorecard.Innings.length - 1].LastOvers['5'].Score}/{scorecard.Innings[scorecard.Innings.length - 1].LastOvers['5'].Wicket}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>—</div>
                                        )}
                                    </div>

                                    {/* This Over balls */}
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>This Over</div>
                                        <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                                            {(() => {
                                                const scLimit = getScorecardThisOver();
                                                const thisOverBalls = scLimit.length > 0 ? scLimit : (latestBall?.thisOver || []);
                                                return thisOverBalls.map((ball: any, idx: number) => (
                                                    <div key={idx} style={{
                                                        width: 24, height: 24, borderRadius: '50%',
                                                        background: getBallColor(ball),
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 10, fontWeight: 700, color: '#fff',
                                                    }}>
                                                        {getBallDisplay(ball)}
                                                    </div>
                                                ));
                                            })()}
                                            {(() => {
                                                const scLimit = getScorecardThisOver();
                                                const thisOverBalls = scLimit.length > 0 ? scLimit : (latestBall?.thisOver || []);
                                                return Array(Math.max(0, 6 - thisOverBalls.length)).fill(null).map((_, idx) => (
                                                    <div key={`e-${idx}`} style={{
                                                        width: 24, height: 24, borderRadius: '50%',
                                                        background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.1)',
                                                    }} />
                                                ));
                                            })()}
                                        </div>
                                    </div>

                                    {/* Placeholder for symmetry */}
                                    <div style={{ minWidth: 70 }} />
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

                {/* Commentary Timeline */}
                {wallstream && wallstream.balls.length > 0 && (
                    <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '0px 20px 16px 20px', marginBottom: 16, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                        <div style={{
                            position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)',
                            paddingTop: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 16
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Commentary</div>
                                <button
                                    onClick={() => setCommentaryExpanded(!commentaryExpanded)}
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '4px 10px',
                                        fontSize: 10,
                                        color: 'rgba(255,255,255,0.6)',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    {commentaryExpanded ? 'Show Less' : 'Show More'}
                                </button>
                            </div>
                        </div>


                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: commentaryExpanded ? 500 : 200, overflowY: 'auto', paddingRight: 4, transition: 'max-height 0.3s ease' }}>
                            {wallstream.balls.map((ball, idx) => {
                                const isLast = idx === wallstream.balls.length - 1;
                                const isLatest = idx === 0;

                                // Check for Over Change - find next actual ball (skip non-ball events)
                                const findNextBall = () => {
                                    for (let i = idx + 1; i < wallstream.balls.length; i++) {
                                        if (wallstream.balls[i].isball) return wallstream.balls[i];
                                    }
                                    return null;
                                };
                                const nextActualBall = findNextBall();
                                const currentOverNum = ball.over ? Math.floor(parseFloat(ball.over)) : -1;
                                const nextOverNum = nextActualBall && nextActualBall.over ? Math.floor(parseFloat(nextActualBall.over)) : -1;
                                const showOverSeparator = ball.isball && nextActualBall && currentOverNum !== nextOverNum && nextOverNum !== -1;

                                // Detect bowler change - when next ball has a different bowler
                                // AND the immediate next event is NOT an explicit 'change_of_bowler' (to avoid double cards)
                                const isBowlerChange = ball.isball && nextActualBall &&
                                    ball.bowlerName && nextActualBall.bowlerName &&
                                    ball.bowlerName !== nextActualBall.bowlerName &&
                                    wallstream.balls[idx + 1]?.detail !== 'change_of_bowler';

                                // Visual Config based on Event Type
                                let markerColor = '#3f3f46'; // default grey
                                const markerText = ball.over || '•';
                                let resultText = '';
                                let resultColor = 'var(--text-muted)';

                                if (ball.isWicket) {
                                    markerColor = '#ef4444';
                                    resultText = 'WICKET!';
                                    resultColor = '#ef4444';
                                } else if (ball.isSix) {
                                    markerColor = '#f97316';
                                    resultText = 'SIX!';
                                    resultColor = '#f97316';
                                } else if (ball.isFour) {
                                    markerColor = '#22c55e';
                                    resultText = 'FOUR!';
                                    resultColor = '#22c55e';
                                } else if (ball.detail?.toLowerCase() === 'nb') {
                                    markerColor = '#f97316'; // Orange for no-ball
                                    resultText = 'NO BALL';
                                    resultColor = '#f97316';
                                } else if (ball.detail?.toLowerCase() === 'wd') {
                                    markerColor = '#eab308'; // Yellow for wide
                                    resultText = 'WIDE';
                                    resultColor = '#eab308';
                                } else if (ball.detail?.toLowerCase() === 'lb') {
                                    resultText = 'Leg Bye';
                                    resultColor = '#60a5fa';
                                } else if (ball.detail?.toLowerCase() === 'b') {
                                    resultText = 'Bye';
                                    resultColor = '#60a5fa';
                                } else {
                                    // Normal run or dot
                                    resultText = `${ball.runs} Run${ball.runs !== '1' ? 's' : ''}`;
                                    if (ball.runs === '0') resultText = 'Dot Ball';
                                }

                                // Format special detail types
                                const formatDetail = (detail: string): string => {
                                    const detailMap: { [key: string]: string } = {
                                        'change_of_bowler': 'Change of Bowler',
                                        'change_of_ends': 'Change of Ends',
                                        'drinks': 'Drinks Break',
                                        'injury': 'Injury Stoppage',
                                        'review': 'DRS Review',
                                        'timeout': 'Strategic Timeout',
                                        'general': '',
                                    };
                                    return detailMap[detail.toLowerCase()] || detail.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                };

                                // Event Card (Non-ball commentary like 'Innings Break', 'Stumps', etc.)
                                if (!ball.isball) {
                                    const formattedDetail = formatDetail(ball.detail);
                                    const isNewBatter = ball.detail?.toLowerCase() === 'next_batsman_in';
                                    const isNewBowler = ball.detail?.toLowerCase() === 'change_of_bowler';

                                    // Helper: Find previous actual ball (Newer in time, lower index)
                                    const findPrevBall = () => {
                                        for (let i = idx - 1; i >= 0; i--) {
                                            if (wallstream.balls[i].isball) return wallstream.balls[i];
                                        }
                                        return null;
                                    };

                                    // Extract player name from commentary for new batter events
                                    // e.g. "Ben Stokes is in" -> "Ben Stokes"
                                    let entityName = '';
                                    let entityRole: 'batsmen' | 'bowler' = 'batsmen';

                                    if (isNewBatter && ball.commentary) {
                                        entityRole = 'batsmen';
                                        const found = findPlayerNameInText(ball.commentary);
                                        if (found) {
                                            entityName = found;
                                        } else {
                                            const nameMatch = ball.commentary.match(/(?:walks|is in|comes out|out to bat|out goes .+ and in walks|joins)\s*([A-Z][a-z]+(?: [A-Z][a-z]+)*)/i) ||
                                                ball.commentary.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s*(?:is in|walks|comes out|joins)/i);
                                            if (nameMatch) entityName = nameMatch[1].replace(/\s+$/, '');
                                        }
                                    } else if (isNewBowler) {
                                        entityRole = 'bowler';
                                        // For explicit bowler change event, look at the NEWER ball (prev index) because list is descending
                                        const prevBall = findPrevBall();
                                        if (prevBall && prevBall.bowlerName) {
                                            entityName = prevBall.bowlerName;
                                        }
                                    }

                                    return (
                                        <div key={idx} style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: 24 }}>
                                            {/* Timeline Line */}
                                            {!isLast && <div style={{ position: 'absolute', left: 14, top: 28, bottom: 0, width: 2, background: 'rgba(255,255,255,0.05)' }} />}

                                            {/* Marker Icon */}
                                            <div style={{
                                                position: 'relative', zIndex: 2, width: 30, height: 30, borderRadius: '50%',
                                                background: (isNewBatter || isNewBowler) ? `rgba(${isNewBatter ? '34, 197, 94' : '139, 92, 246'}, 0.15)` : 'rgba(59, 130, 246, 0.15)',
                                                border: `1px solid ${(isNewBatter || isNewBowler) ? `rgba(${isNewBatter ? '34, 197, 94' : '139, 92, 246'}, 0.3)` : 'rgba(59, 130, 246, 0.3)'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: (isNewBatter || isNewBowler) ? (isNewBatter ? '#22c55e' : '#8b5cf6') : '#3b82f6',
                                                fontSize: 14, fontWeight: 800, fontFamily: 'serif'
                                            }}>
                                                {(isNewBatter || isNewBowler) ? '→' : 'i'}
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, marginTop: 4 }}>
                                                {(isNewBatter || isNewBowler) && entityName ? (() => {
                                                    const playerId = findPlayerIdByName(entityName);
                                                    // Look up player H2H using ID if available, then name
                                                    const h2hPlayer = findPlayerInH2H(entityName, entityRole, playerId);
                                                    const recentForm = h2hPlayer ? getRecentForm(h2hPlayer, entityRole) : null;
                                                    const iccRanking = h2hPlayer?.icc_ranking;
                                                    // Specific for bowler: check if bowled
                                                    let bowlerStatsText: React.ReactNode | null = null;
                                                    if (entityRole === 'bowler') {
                                                        const prevBall = findPrevBall();
                                                        const targetBall = prevBall || nextActualBall; // Fallback to next if prev not available (unlikely for change event)

                                                        if (targetBall) {
                                                            const hasBowled = targetBall.bowlerOvers && parseFloat(targetBall.bowlerOvers) >= 1;
                                                            if (hasBowled) {
                                                                bowlerStatsText = <span>{targetBall.bowlerOvers}ov • {targetBall.bowlerMaidens}m • {targetBall.bowlerRuns}r • {targetBall.bowlerWickets}w</span>;
                                                            }
                                                        }
                                                    }

                                                    const themeColor = entityRole === 'batsmen' ? '#22c55e' : '#8b5cf6';
                                                    const title = entityRole === 'batsmen' ? 'New Batter' : 'Bowling Change';

                                                    return (
                                                        <div style={{
                                                            background: `rgba(${entityRole === 'batsmen' ? '34, 197, 94' : '139, 92, 246'}, 0.08)`,
                                                            border: `1px solid rgba(${entityRole === 'batsmen' ? '34, 197, 94' : '139, 92, 246'}, 0.2)`,
                                                            borderRadius: 12,
                                                            padding: 12,
                                                            display: 'flex',
                                                            gap: 12,
                                                            alignItems: 'center'
                                                        }}>
                                                            <WikiImage
                                                                name={entityName}
                                                                id={playerId}
                                                                type="player"
                                                                circle={true}
                                                                style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.1)' }}
                                                            />
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: 11, color: themeColor, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{title}</div>
                                                                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{entityName}</div>
                                                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, display: 'flex', gap: 8 }}>
                                                                    {bowlerStatsText ? bowlerStatsText : (
                                                                        <>
                                                                            {recentForm && <span>{recentForm.label}: {recentForm.value}</span>}
                                                                            {iccRanking && <span style={{ color: themeColor }}>#{iccRanking} ICC</span>}
                                                                            {!recentForm && !iccRanking && entityRole === 'bowler' && <span>First spell</span>}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })() : (
                                                    <>
                                                        {formattedDetail && <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 4 }}>{formattedDetail}</div>}
                                                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: '1.5' }}>{ball.commentary}</div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }

                                // Helper to check if commentary body should be shown
                                const isRedundantBody = ball.commentary && /^(no run|dot ball|\d+\s*runs?|wide|bye|leg\s*bye|four|six|wicket)[!.]*$/i.test(ball.commentary.trim());
                                const showBody = ball.commentary && !isRedundantBody;

                                return (
                                    <React.Fragment key={idx}>
                                        <div style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: 24, alignItems: showBody ? 'flex-start' : 'center' }}>
                                            {/* Timeline Line */}
                                            {!isLast && <div style={{ position: 'absolute', left: 14, top: 28, bottom: 0, width: 2, background: 'rgba(255,255,255,0.05)' }} />}

                                            {/* Ball Marker */}
                                            <div style={{
                                                position: 'relative', zIndex: 2,
                                                width: 30, height: 30, borderRadius: '50%',
                                                background: markerColor,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 10, fontWeight: 700, color: '#fff',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}>
                                                {markerText}
                                            </div>

                                            {/* Content Block */}
                                            <div style={{ flex: 1, marginTop: 0 }}>
                                                {/* Header: Bowler to Batsman */}
                                                <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                                                    <div style={{ fontSize: 14, color: '#fff' }}>
                                                        <span style={{ fontWeight: 600 }}>{ball.bowlerName}</span> to <span style={{ fontWeight: 600 }}>{ball.batsmanName}</span>
                                                    </div>
                                                    <div style={{ fontSize: 11, fontWeight: 800, color: resultColor, textTransform: 'uppercase', background: `${resultColor}15`, padding: '2px 8px', borderRadius: 6 }}>
                                                        {resultText}
                                                    </div>
                                                </div>

                                                {/* Body: Commentary - Only show if it adds value beyond basic run count */}
                                                {showBody && (
                                                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: '1.5', fontFamily: 'Inter, sans-serif' }}>
                                                        {ball.commentary}
                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                        {/* Over Separator */}
                                        {
                                            showOverSeparator && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, opacity: 0.6 }}>
                                                    <div style={{ width: 30, display: 'flex', justifyContent: 'center' }}><div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} /></div>
                                                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                                                    <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>End of Over {nextOverNum + 1}</div>
                                                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                                                </div>
                                            )
                                        }

                                        {/* Bowler Change Card - Moved AFTER Separator */}
                                        {isBowlerChange && (() => {
                                            const newBowlerName = ball.bowlerName;
                                            const targetBall = ball;
                                            const hasBowled = targetBall.bowlerOvers && parseFloat(targetBall.bowlerOvers) >= 1;

                                            const bowlerId = findPlayerIdByName(newBowlerName);
                                            const h2hPlayer = !hasBowled ? findPlayerInH2H(newBowlerName, 'bowler', bowlerId) : null;
                                            const recentForm = h2hPlayer ? getRecentForm(h2hPlayer, 'bowler') : null;
                                            const iccRanking = h2hPlayer?.icc_ranking;

                                            return (
                                                <div style={{
                                                    display: 'flex',
                                                    gap: 12,
                                                    marginBottom: 24, // Added margin bottom since it's now freestanding
                                                    padding: 12,
                                                    background: 'rgba(139, 92, 246, 0.08)',
                                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                                    borderRadius: 12,
                                                    alignItems: 'center'
                                                }}>
                                                    <WikiImage name={newBowlerName} id={bowlerId} type="player" circle={true} style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.1)' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Bowling Change</div>
                                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{newBowlerName}</div>
                                                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, display: 'flex', gap: 8 }}>
                                                            {hasBowled ? (
                                                                <span>{targetBall.bowlerOvers}ov • {targetBall.bowlerMaidens}m • {targetBall.bowlerRuns}r • {targetBall.bowlerWickets}w</span>
                                                            ) : (
                                                                <>
                                                                    {recentForm && <span>{recentForm.label}: {recentForm.value}</span>}
                                                                    {iccRanking && <span style={{ color: '#8b5cf6' }}>#{iccRanking} ICC</span>}
                                                                    {!recentForm && !iccRanking && <span>First spell</span>}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                )
                }

                {/* Full Scorecard with Innings Tabs */}
                {
                    scorecard?.Innings && scorecard.Innings.length > 0 ? (() => {
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
                                                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                                                                        {bat.Howout_short || (isOnCrease ? 'batting' : (parseInt(bat.Balls) > 0 ? 'not out' : 'yet to bat'))}
                                                                    </div>
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

                                {/* Fall of Wickets - compact line */}
                                {selectedInn.FallofWickets?.length > 0 && (
                                    <div style={{ padding: '8px 16px', fontSize: 11, color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: 6 }}>FOW:</span>
                                        {selectedInn.FallofWickets.map((fow: any, idx: number) => (
                                            <span key={idx}>
                                                {fow.Score}-{fow.Wicket_No}
                                                {idx < selectedInn.FallofWickets.length - 1 && <span style={{ margin: '0 4px', opacity: 0.3 }}>,</span>}
                                            </span>
                                        ))}
                                    </div>
                                )}

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
                                        {/* Extras Row */}
                                        {(() => {
                                            const b = parseInt(selectedInn.Byes) || 0;
                                            const lb = parseInt(selectedInn.Legbyes) || 0;
                                            const w = parseInt(selectedInn.Wides) || 0;
                                            const nb = parseInt(selectedInn.Noballs) || 0;
                                            const p = parseInt(selectedInn.Penalty) || 0;
                                            const totalExtras = b + lb + w + nb + p;
                                            const details: string[] = [];
                                            if (b > 0) details.push(`b ${b}`);
                                            if (lb > 0) details.push(`lb ${lb}`);
                                            if (w > 0) details.push(`w ${w}`);
                                            if (nb > 0) details.push(`nb ${nb}`);
                                            if (p > 0) details.push(`p ${p}`);

                                            return (
                                                <tfoot>
                                                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                                                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Extras</td>
                                                        <td colSpan={5} style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#fff', fontFamily: 'monospace', fontSize: 13 }}>
                                                            {totalExtras}
                                                            {details.length > 0 && (
                                                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 8, fontWeight: 400 }}>
                                                                    ({details.join(', ')})
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            );
                                        })()}
                                    </table>
                                </div>

                                {/* Partnerships Section - Inside Scorecard */}
                                {selectedInn.Partnerships?.length > 0 && (
                                    <>
                                        <h4 style={{ margin: '16px 16px 10px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Partnerships</h4>
                                        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {selectedInn.Partnerships.map((p: any, idx: number) => {
                                                const totalRuns = parseInt(p.Runs) || 1;
                                                const bat1 = p.Batsmen?.[0];
                                                const bat2 = p.Batsmen?.[1];
                                                const bat1Runs = parseInt(bat1?.Runs) || 0;
                                                const bat2Runs = parseInt(bat2?.Runs) || 0;
                                                const bat1Pct = totalRuns > 0 ? (bat1Runs / totalRuns) * 100 : 50;
                                                const bat1Name = bat1?.name || scorecard.Teams?.[selectedInn.Battingteam]?.Players?.[bat1?.Batsman]?.Name_Full || 'P1';
                                                const bat2Name = bat2?.name || scorecard.Teams?.[selectedInn.Battingteam]?.Players?.[bat2?.Batsman]?.Name_Full || 'P2';
                                                const isLatestInnings = selectedInningsIdx === scorecard.Innings.length - 1;
                                                const isCurrent = isLatestInnings && (p.Isunbeaten === 'true' || p.Isunbeaten === true);

                                                return (
                                                    <div key={idx} style={{
                                                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                                                        background: isCurrent ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255,255,255,0.02)',
                                                        borderRadius: 8,
                                                        border: isCurrent ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.04)'
                                                    }}>
                                                        {/* Wicket # */}
                                                        <div style={{ fontSize: 10, color: isCurrent ? '#22c55e' : 'rgba(255,255,255,0.4)', fontWeight: 700, minWidth: 18 }}>{p.ForWicket}{isCurrent && '*'}</div>

                                                        {/* Player 1 */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
                                                            <WikiImage name={bat1Name} id={bat1?.Batsman} type="player" style={{ width: 24, height: 24 }} circle={true} />
                                                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 40 }}>{bat1Name.split(' ').pop()}</div>
                                                        </div>
                                                        <div style={{ fontSize: 10, color: '#60a5fa', fontWeight: 600, minWidth: 20, textAlign: 'center', fontFamily: 'monospace' }}>{bat1Runs}</div>

                                                        {/* Contribution Bar */}
                                                        <div style={{ flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.08)' }}>
                                                            <div style={{ width: `${bat1Pct}%`, background: '#60a5fa', height: '100%' }} />
                                                            <div style={{ width: `${100 - bat1Pct}%`, background: '#f97316', height: '100%' }} />
                                                        </div>

                                                        {/* Player 2 */}
                                                        <div style={{ fontSize: 10, color: '#f97316', fontWeight: 600, minWidth: 20, textAlign: 'center', fontFamily: 'monospace' }}>{bat2Runs}</div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
                                                            <WikiImage name={bat2Name} id={bat2?.Batsman} type="player" style={{ width: 24, height: 24 }} circle={true} />
                                                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 40 }}>{bat2Name.split(' ').pop()}</div>
                                                        </div>

                                                        {/* Total */}
                                                        <div style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? '#22c55e' : '#fff', fontFamily: 'monospace', minWidth: 40, textAlign: 'right' }}>
                                                            {p.Runs}<span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>({p.Balls})</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                            </div>
                        );
                    })() : (
                        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', border: '1px solid var(--border-color)' }}>
                            Loading detailed scorecard...
                        </div>
                    )
                }








                {/* Squads with Selector */}
                {
                    scorecard?.Teams && (() => {
                        const teamEntries = Object.entries(scorecard.Teams);
                        const selectedTeam = teamEntries[selectedSquadIdx];
                        if (!selectedTeam) return null;
                        const [, team] = selectedTeam as [string, any];

                        return (
                            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 20px', marginTop: 16, border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Squads</div>
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
                    })()
                }
            </div>
        </div >
    );
};

export default LiveDetail;
