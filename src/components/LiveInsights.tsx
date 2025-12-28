import React from 'react';
import { BatsmanSplitsResponse, OverByOverResponse } from '../utils/h2hApi';

interface LiveInsightsProps {
    h2hData: any;
    scorecard?: any;
    batsmanSplits?: BatsmanSplitsResponse | null;
    overByOver?: OverByOverResponse | null;
}

const LiveInsights: React.FC<LiveInsightsProps> = ({ h2hData, scorecard, batsmanSplits, overByOver }) => {
    if (!h2hData) return null;

    // Extract pitch and umpire info from scorecard
    const matchDetails = scorecard?.Match_Details;
    const pitchDetail = matchDetails?.Pitch_Detail;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Pitch Report Card */}
            {pitchDetail?.Pitch_Suited_For && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🏏 Pitch Report</div>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{pitchDetail.Pitch_Suited_For}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Suited For</div>
                        </div>
                        {pitchDetail.Pitch_Surface && (
                            <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{pitchDetail.Pitch_Surface}</div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Surface</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Match Officials Card */}
            {matchDetails?.Umpire1_Name && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>⚖️ Match Officials</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>On-field Umpire</span>
                            <span style={{ fontSize: 12, color: '#fff' }}>{matchDetails.Umpire1_Name}</span>
                        </div>
                        {matchDetails.Umpire2_Name && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>On-field Umpire</span>
                                <span style={{ fontSize: 12, color: '#fff' }}>{matchDetails.Umpire2_Name}</span>
                            </div>
                        )}
                        {matchDetails.Umpire3_Name && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Third Umpire</span>
                                <span style={{ fontSize: 12, color: '#fff' }}>{matchDetails.Umpire3_Name}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Over-by-Over Manhattan Chart */}
            {overByOver?.Overbyover && overByOver.Overbyover.length > 0 && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>📊 Over-by-Over</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
                        {overByOver.Overbyover.map((over, idx) => {
                            const runs = parseInt(over.Runs) || 0;
                            const wickets = parseInt(over.Wickets) || 0;
                            const maxRuns = Math.max(...overByOver.Overbyover.map(o => parseInt(o.Runs) || 0), 10);
                            const height = Math.max((runs / maxRuns) * 60, 4);
                            return (
                                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        width: '100%',
                                        height: height,
                                        background: wickets > 0 ? '#ef4444' : runs >= 10 ? '#4ade80' : 'rgba(255,255,255,0.2)',
                                        borderRadius: 2,
                                        position: 'relative',
                                    }}>
                                        {wickets > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: -12,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                fontSize: 8,
                                                color: '#ef4444',
                                                fontWeight: 700,
                                            }}>W</div>
                                        )}
                                    </div>
                                    {idx % 5 === 0 && (
                                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{over.Over}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                            Total: {overByOver.Overbyover.reduce((sum, o) => sum + (parseInt(o.Runs) || 0), 0)} runs
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                            Wickets: {overByOver.Overbyover.reduce((sum, o) => sum + (parseInt(o.Wickets) || 0), 0)}
                        </span>
                    </div>
                </div>
            )}

            {/* Batsman Matchups Card */}
            {batsmanSplits?.Batsmen && Object.keys(batsmanSplits.Batsmen).length > 0 && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🎯 Batsman Matchups</div>
                    {Object.entries(batsmanSplits.Batsmen).slice(0, 3).map(([playerId, data]) => {
                        // Get top 3 bowlers faced (by balls)
                        const bowlersList = Object.entries(data.Against || {})
                            .sort((a, b) => parseInt(b[1].Balls) - parseInt(a[1].Balls))
                            .slice(0, 3);

                        if (bowlersList.length === 0) return null;

                        return (
                            <div key={playerId} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{data.Batsman}</span>
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{data.Style} • {data.DotBalls} dots</span>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {bowlersList.map(([bowlerId, vs]) => {
                                        const sr = parseFloat(vs.Strikerate) || 0;
                                        const color = sr >= 130 ? '#4ade80' : sr >= 100 ? '#facc15' : '#ef4444';
                                        return (
                                            <div key={bowlerId} style={{
                                                flex: 1,
                                                padding: 8,
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: 6,
                                                textAlign: 'center',
                                            }}>
                                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{vs.Bowler}</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color }}>{vs.Runs}/{vs.Balls}</div>
                                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>SR: {vs.Strikerate}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* H2H Record Card - Enhanced */}
            {h2hData.team?.head_to_head?.comp_type?.data && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🏆 Head to Head</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {(h2hData.team.head_to_head.comp_type.data as any[]).slice(0, 2).map((t: any, idx: number) => (
                            <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{ fontSize: 28, fontWeight: 700, color: idx === 0 ? '#4ade80' : '#60a5fa' }}>{t.win || 0}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{t.short_name}</div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{t.matches || 0} matches</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent H2H Matches */}
            {h2hData.team?.against_last_n_matches?.result?.length > 0 && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Recent Encounters</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(h2hData.team.against_last_n_matches.result as any[]).slice(0, 5).map((m: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div>
                                    <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{m.winner_team_name || 'Draw'}</div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{m.venue_name}</div>
                                </div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{m.match_start_date}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Venue Stats */}
            {h2hData.team?.head_to_head?.venue && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>📍 Venue Stats</div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginBottom: 8 }}>{h2hData.team.head_to_head.venue.venue_display_name || h2hData.team.head_to_head.venue.venue}</div>
                    {h2hData.team.head_to_head.venue.data && (
                        <div style={{ display: 'flex', gap: 12 }}>
                            {(h2hData.team.head_to_head.venue.data as any[]).slice(0, 2).map((t: any, idx: number) => (
                                <div key={idx} style={{ flex: 1, textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: idx === 0 ? '#4ade80' : '#60a5fa' }}>{t.win}</div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{t.short_name} wins</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LiveInsights;
