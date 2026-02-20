import React, { useState, useEffect, useMemo } from 'react';
import { Match, Scorecard } from '../../types';
import { User } from 'firebase/auth';
import { FantasyTeam } from '../../utils/useFantasyTeam';
import { LuChevronLeft, LuShield, LuSwords, LuStar, LuTrophy, LuUser } from 'react-icons/lu';
import { fetchScorecard, calcBatFP, calcBowlFP } from '../../utils/dream11Predictor';
import WikiImage from '../WikiImage';

interface TeamViewProps {
    match: Match;
    user: User;
    team: FantasyTeam;
    onBack: () => void;
}

interface PlayerPoints {
    id: string;
    name: string;
    role: 'WK' | 'BAT' | 'AR' | 'BOWL';
    isCaptain: boolean;
    isViceCaptain: boolean;
    batFP: number;
    bowlFP: number;
    totalFP: number;
    teamName: string;
}

export default function TeamView({ match, user, team, onBack }: TeamViewProps) {
    const [playersWithPoints, setPlayersWithPoints] = useState<PlayerPoints[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadPoints() {
            setLoading(true);
            setError(null);
            try {
                // Fetch full scorecard to calculate points
                const scorecard = await fetchScorecard(match.game_id);
                if (!scorecard || !scorecard.Teams) {
                    throw new Error('Scorecard not available yet.');
                }

                // Map player names and teams
                const playerMeta = new Map<string, { name: string, teamName: string }>();
                for (const [teamId, teamData] of Object.entries(scorecard.Teams) as [string, any][]) {
                    const tName = teamId === match.participants?.[0]?.id ? match.participants?.[0]?.short_name : match.participants?.[1]?.short_name || 'Team';
                    if (teamData.Players) {
                        for (const [pId, pInfo] of Object.entries(teamData.Players) as [string, any][]) {
                            playerMeta.set(pId, { name: pInfo.Name_Full, teamName: tName });
                        }
                    }
                }

                // Calculate FP for all players in scorecard
                const fpMap = new Map<string, { batFP: number; bowlFP: number; totalFP: number }>();

                const innings = scorecard?.Innings || [];
                if (Array.isArray(innings)) {
                    for (const innData of innings) {
                        const batsmen = innData.Batsmen || [];
                        for (const bat of batsmen) {
                            const pId = bat.Batsman;
                            if (!pId) continue;
                            const fp = calcBatFP(parseInt(bat.Runs) || 0, parseInt(bat.Balls) || 0, parseInt(bat.Fours) || 0, parseInt(bat.Sixes) || 0);
                            const exist = fpMap.get(pId) || { batFP: 0, bowlFP: 0, totalFP: 0 };
                            exist.batFP += fp;
                            exist.totalFP = exist.batFP + exist.bowlFP;
                            fpMap.set(pId, exist);
                        }

                        const bowlers = innData.Bowlers || [];
                        for (const bowl of bowlers) {
                            const pId = bowl.Bowler;
                            if (!pId) continue;
                            const fp = calcBowlFP(parseInt(bowl.Wickets) || 0, parseInt(bowl.Runs) || 0, parseFloat(bowl.Overs) || 0);
                            const exist = fpMap.get(pId) || { batFP: 0, bowlFP: 0, totalFP: 0 };
                            exist.bowlFP += fp;
                            exist.totalFP = exist.batFP + exist.bowlFP;
                            fpMap.set(pId, exist);
                        }
                    }
                }

                // Combine user's selected team with calculated points
                const resultPlayers = team.players.map(p => {
                    const meta = playerMeta.get(p.playerId);
                    const fp = fpMap.get(p.playerId);

                    let basePoints = fp?.totalFP || 0;
                    // Apply multipliers
                    if (p.isCaptain) basePoints *= 2;
                    if (p.isViceCaptain) basePoints *= 1.5;

                    return {
                        id: p.playerId,
                        role: p.role,
                        isCaptain: p.isCaptain,
                        isViceCaptain: p.isViceCaptain,
                        name: meta?.name || `Player ${p.playerId}`,
                        teamName: meta?.teamName || '',
                        batFP: fp?.batFP || 0,
                        bowlFP: fp?.bowlFP || 0,
                        totalFP: basePoints
                    };
                });

                setPlayersWithPoints(resultPlayers);
            } catch (err: any) {
                console.error("Error calculating points:", err);
                setError(err.message || 'Failed to calculate points');
            } finally {
                setLoading(false);
            }
        }

        loadPoints();
    }, [match.game_id, team.players]);

    const totalTeamPoints = useMemo(() => {
        return playersWithPoints.reduce((sum, p) => sum + p.totalFP, 0);
    }, [playersWithPoints]);

    const renderRoleSection = (role: 'WK' | 'BAT' | 'AR' | 'BOWL', title: string) => {
        const pList = playersWithPoints.filter(p => p.role === role);
        if (pList.length === 0) return null;

        return (
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>{title} ({pList.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pList.map(p => (
                        <div key={p.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                            padding: '12px 16px', borderRadius: 16
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    <WikiImage name={p.name} id={p.id} type="player" style={{ width: '100%', height: '100%', objectFit: 'cover' }} circle />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ fontWeight: 600, fontSize: 15, color: '#fff' }}>{p.name}</div>
                                        {p.isCaptain && <div style={{ fontSize: 10, color: '#000', background: '#eab308', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>C</div>}
                                        {p.isViceCaptain && <div style={{ fontSize: 10, color: '#000', background: '#94a3b8', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>VC</div>}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                                        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: p.teamName === match.participants?.[0]?.short_name ? '#ec4899' : '#3b82f6', marginRight: 6 }} />
                                        {p.teamName}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: p.totalFP > 0 ? '#22c55e' : '#fff' }}>
                                    {p.totalFP}
                                </div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 0 }}>PTS</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '24px 20px',
            paddingBottom: 110,
            maxWidth: 600,
            margin: '0 auto',
            width: '100%',
            position: 'relative'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 24
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: 8,
                        borderRadius: 12,
                        transition: 'all 0.2s'
                    }}
                >
                    <LuChevronLeft size={20} />
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Your Squad</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <div style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: match.event_state === 'L' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)',
                            color: match.event_state === 'L' ? '#fca5a5' : '#fff',
                        }}>
                            {match.event_state === 'L' ? 'LIVE' : 'COMPLETED'}
                        </div>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                            {match.participants?.[0]?.short_name} vs {match.participants?.[1]?.short_name}
                        </span>
                    </div>
                </div>
            </div>

            {/* Score Banner */}
            {!loading && (
                <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(255,255,255,0.02))',
                    borderRadius: 20,
                    border: '1px solid rgba(236,72,153,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    marginBottom: 24
                }}>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                        Total Points
                    </div>
                    <div style={{ fontSize: 48, fontWeight: 800, color: '#ec4899', lineHeight: 1, letterSpacing: '-2px' }}>
                        {totalTeamPoints}
                    </div>
                </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'visible' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' }}>
                        <div className="login-spinner" style={{ margin: '0 auto 16px', borderColor: '#ec4899', borderRightColor: 'transparent' }} />
                        Calculating points...
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 16, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {error}
                    </div>
                ) : (
                    <>
                        {renderRoleSection('WK', 'Wicket Keepers')}
                        {renderRoleSection('BAT', 'Batters')}
                        {renderRoleSection('AR', 'All Rounders')}
                        {renderRoleSection('BOWL', 'Bowlers')}
                    </>
                )}
            </div>
        </div>
    );
}
