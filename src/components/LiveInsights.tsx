import React from 'react';
import { BatsmanSplitsResponse, OverByOverResponse } from '../utils/h2hApi';
import { Match } from '../types';
import H2HCard from './upcoming/H2HCard';
import VenueCard from './upcoming/VenueCard';
import WikiImage from './WikiImage';
import { getTeamColor } from '../utils/teamColors';

interface LiveInsightsProps {
    match?: Match;
    h2hData: any;
    scorecard?: any;
    batsmanSplits?: BatsmanSplitsResponse | null;
    overByOver?: OverByOverResponse | null;
}

const LiveInsights: React.FC<LiveInsightsProps> = ({ match, h2hData, scorecard, batsmanSplits, overByOver }) => {
    if (!h2hData) return null;

    const team1 = match?.participants?.[0];
    const team2 = match?.participants?.[1];

    const t1Id = team1?.id ? parseInt(team1.id) : undefined;
    const t2Id = team2?.id ? parseInt(team2.id) : undefined;
    const teamIds: [number, number] | undefined = t1Id && t2Id ? [t1Id, t2Id] : undefined;

    // Extract pitch and umpire info from scorecard
    const matchDetails = scorecard?.Matchdetail || scorecard?.Match_Details;
    const pitchDetail = matchDetails?.Pitch_Detail;

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 1. Win Predictor / Equation (if live) */}
            {matchDetails?.Equation && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                    borderRadius: 16,
                    padding: '20px',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: 11, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 8 }}>Match Equation</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>
                        {matchDetails.Equation}
                    </div>
                </div>
            )}

            {/* 2. Pitch Report */}
            {(pitchDetail?.Pitch_Suited_For || pitchDetail?.Pitch_Surface) && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 16,
                    padding: 20,
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <div style={{ width: 4, height: 16, background: '#f59e0b', borderRadius: 2 }} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Pitch Report</div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        {pitchDetail?.Pitch_Suited_For && (
                            <div style={{ flex: 1, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Suited For</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{pitchDetail.Pitch_Suited_For}</div>
                            </div>
                        )}
                        {pitchDetail?.Pitch_Surface && (
                            <div style={{ flex: 1, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Surface</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{pitchDetail.Pitch_Surface}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. Matchups (Rich UI) */}
            {batsmanSplits?.Batsmen && Object.keys(batsmanSplits.Batsmen).length > 0 && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 16,
                    padding: 20,
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <div style={{ width: 4, height: 16, background: '#8b5cf6', borderRadius: 2 }} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Key Matchups</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {Object.entries(batsmanSplits.Batsmen).slice(0, 5).map(([playerId, data]) => {
                            // Sort bowlers by balls faced
                            const bowlersList = Object.entries(data.Against || {})
                                .sort((a, b) => parseInt(b[1].Balls) - parseInt(a[1].Balls))
                                .filter(b => parseInt(b[1].Balls) > 0) // Only show real matchups
                                .slice(0, 3);

                            if (bowlersList.length === 0) return null;

                            return (
                                <div key={playerId}>
                                    {/* Batsman Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                        <WikiImage
                                            name={data.Batsman}
                                            type="player"
                                            className="player-avatar"
                                            style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }}
                                            circle={true}
                                        />
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{data.Batsman}</div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{data.Style}</div>
                                        </div>
                                    </div>

                                    {/* Bowlers Container (Horizontal Scroll) */}
                                    <div className="hide-scrollbar" style={{
                                        display: 'flex',
                                        gap: 10,
                                        overflowX: 'auto',
                                        paddingBottom: 4
                                    }}>
                                        {bowlersList.map(([bowlerId, vs]) => {
                                            const sr = parseFloat(vs.Strikerate) || 0;
                                            // Color code SR
                                            const srColor = sr > 150 ? '#22c55e' : sr > 100 ? '#facc15' : '#ef4444';
                                            // Color code dismissals
                                            const outs = parseInt(vs.Dismissals) || 0;

                                            return (
                                                <div key={bowlerId} style={{
                                                    minWidth: 110,
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: 12,
                                                    padding: 10,
                                                    border: outs > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                                                    position: 'relative'
                                                }}>
                                                    {outs > 0 && (
                                                        <div style={{
                                                            position: 'absolute', top: -6, right: -6,
                                                            background: '#ef4444', color: '#fff',
                                                            fontSize: 9, fontWeight: 700,
                                                            padding: '2px 6px', borderRadius: 8,
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                                        }}>{outs} Wkt</div>
                                                    )}

                                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {vs.Bowler}
                                                    </div>
                                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                                                        {vs.Runs} <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>off {vs.Balls}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: srColor }} />
                                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>SR {vs.Strikerate}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 4. Manhattan Chart (Over by Over) */}
            {overByOver?.Overbyover && overByOver.Overbyover.length > 0 && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 16,
                    padding: 20,
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 4, height: 16, background: '#3b82f6', borderRadius: 2 }} />
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Innings Progression</div>
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                            {overByOver.Overbyover.length} Overs
                        </div>
                    </div>

                    {/* Scrollable Chart */}
                    <div className="hide-scrollbar" style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: 4,
                        height: 120,
                        overflowX: 'auto',
                        paddingBottom: 20 // Space for labels
                    }}>
                        {overByOver.Overbyover.map((over, idx) => {
                            const runs = parseInt(over.Runs) || 0;
                            const wickets = parseInt(over.Wickets) || 0;
                            // Normalize height: Max expected runs per over ~25
                            const heightPct = Math.min((runs / 25) * 100, 100);
                            const barHeight = Math.max((runs / 25) * 100, 4); // Min 4px

                            return (
                                <div key={idx} style={{
                                    flex: '0 0 14px', // Fixed width bars
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        width: '100%',
                                        height: `${barHeight}%`,
                                        background: wickets > 0 ? '#ef4444' : runs >= 10 ? '#22c55e' : runs >= 6 ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                                        borderRadius: '2px 2px 0 0',
                                        transition: 'all 0.3s ease'
                                    }} />

                                    {/* Wicket Indicator */}
                                    {wickets > 0 && (
                                        <div style={{
                                            position: 'absolute',
                                            top: `${100 - barHeight - 15}%`,
                                            width: 12, height: 12,
                                            background: '#ef4444',
                                            borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 7, fontWeight: 700, color: '#fff',
                                            zIndex: 2,
                                            border: '1px solid var(--bg-card)'
                                        }}>W</div>
                                    )}

                                    {/* Over Number (Every 5) */}
                                    {(idx + 1) % 5 === 0 && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: -18,
                                            fontSize: 9,
                                            color: 'rgba(255,255,255,0.4)',
                                            whiteSpace: 'nowrap'
                                        }}>{idx + 1}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 5. Head to Head (Premium Card) */}
            {h2hData.team?.head_to_head?.comp_type?.data && (
                <div style={{ padding: '0 0px' }}>
                    <H2HCard
                        teams={h2hData.team.head_to_head.comp_type.data}
                        teamIds={teamIds}
                        title="Head to Head"
                    />
                </div>
            )}

            {/* 6. Venue Stats (Premium Card) */}
            {h2hData.team?.head_to_head?.venue && (
                <VenueCard
                    venue={h2hData.team.head_to_head.venue}
                    teamIds={teamIds}
                    pitchDetails={pitchDetail ? {
                        Pitch_Suited_For: pitchDetail.Pitch_Suited_For,
                        Pitch_Surface: pitchDetail.Pitch_Surface
                    } : undefined}
                />
            )}

            {/* 7. Match Officials (Simple Footer) */}
            {matchDetails?.Umpire1_Name && (
                <div style={{
                    padding: 16,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 16,
                    opacity: 0.6
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>Umpire</div>
                        <div style={{ fontSize: 11, color: '#fff' }}>{matchDetails.Umpire1_Name}</div>
                    </div>
                    {matchDetails.Umpire2_Name && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>Umpire</div>
                            <div style={{ fontSize: 11, color: '#fff' }}>{matchDetails.Umpire2_Name}</div>
                        </div>
                    )}
                    {matchDetails.Referee_Name && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 9, textTransform: 'uppercase', marginBottom: 2 }}>Referee</div>
                            <div style={{ fontSize: 11, color: '#fff' }}>{matchDetails.Referee_Name}</div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default LiveInsights;
