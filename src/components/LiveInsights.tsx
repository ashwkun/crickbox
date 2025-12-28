import React, { useState } from 'react';
import { BatsmanSplitsResponse, OverByOverResponse } from '../utils/h2hApi';
import { Match } from '../types';
import H2HCard from './upcoming/H2HCard';
import VenueCard from './upcoming/VenueCard';
import WikiImage from './WikiImage';
import { getTeamColor } from '../utils/teamColors';
import DualTeamRecentForm from './upcoming/DualTeamRecentForm';
import H2HRecentMatches from './upcoming/H2HRecentMatches';
import WagonWheel from './insights/WagonWheel';
import WormChart from './insights/WormChart';
import PartnershipsChart from './insights/PartnershipsChart';

interface LiveInsightsProps {
    match?: Match;
    h2hData: any;
    scorecard?: any;
    batsmanSplits?: BatsmanSplitsResponse | null;
    overByOver?: OverByOverResponse | null;
    overByOver1?: OverByOverResponse | null;
    overByOver2?: OverByOverResponse | null;
    wagonWheelInnings?: number;
    onWagonWheelInningsChange?: (innings: number) => void;
    isWagonWheelLoading?: boolean;
}


const LiveInsights: React.FC<LiveInsightsProps> = ({ match, h2hData, scorecard, batsmanSplits, overByOver, overByOver1, overByOver2, wagonWheelInnings, onWagonWheelInningsChange, isWagonWheelLoading }) => {
    const [manhattanInnings, setManhattanInnings] = useState<1 | 2>(1);
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

            {/* Wagon Wheel */}
            <WagonWheel
                batsmanSplits={batsmanSplits || null}
                scorecard={scorecard}
                selectedInnings={wagonWheelInnings}
                onInningsChange={onWagonWheelInningsChange}
                isLoading={isWagonWheelLoading}
            />

            {/* Worm Chart */}
            <WormChart
                innings1={overByOver1?.Overbyover || null}
                innings2={overByOver2?.Overbyover || null}
                team1Name={team1?.name || 'Team 1'}
                team2Name={team2?.name || 'Team 2'}
                team1ShortName={team1?.short_name || team1?.name || 'T1'}
                team2ShortName={team2?.short_name || team2?.name || 'T2'}
                team1Id={team1?.id}
                team2Id={team2?.id}
            />

            {/* Partnerships Chart */}
            <PartnershipsChart scorecard={scorecard} />

            {/* Batsman vs Bowler Matchups */}
            {batsmanSplits?.Batsmen && Object.keys(batsmanSplits.Batsmen).length > 0 && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 16,
                    padding: '16px 20px',
                    border: '1px solid var(--border-color)',
                    marginBottom: 16
                }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Batsman vs Bowler</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {Object.entries(batsmanSplits.Batsmen).slice(0, 3).map(([playerId, data]) => {
                            const bowlersList = Object.entries(data.Against || {})
                                .sort((a, b) => parseInt(b[1].Balls) - parseInt(a[1].Balls))
                                .filter(b => parseInt(b[1].Balls) > 0)
                                .slice(0, 3);

                            if (bowlersList.length === 0) return null;

                            return (
                                <div key={playerId}>
                                    {/* Batsman Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                        <WikiImage
                                            name={data.Batsman}
                                            id={playerId}
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
                                                    position: 'relative',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    textAlign: 'center'
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

                                                    <WikiImage
                                                        name={vs.Bowler}
                                                        id={bowlerId}
                                                        type="player"
                                                        style={{ width: 32, height: 32, borderRadius: '50%', marginBottom: 8, border: '1px solid rgba(255,255,255,0.1)' }}
                                                    />

                                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                                        {vs.Bowler}
                                                    </div>
                                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
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
                            // Max it at 100%
                            const barHeight = Math.min(Math.max((runs / 25) * 100, 4), 100);

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

            {/* 5. Recent Form (Dual Team) */}
            {team1?.id && team2?.id && (
                <div style={{ padding: '0 0px' }}>
                    <DualTeamRecentForm
                        team1={{ id: team1.id, name: team1.name, short_name: team1.short_name }}
                        team2={{ id: team2.id, name: team2.name, short_name: team2.short_name }}
                        currentFormat={match?.event_format || match?.match_type}
                    // onMatchClick not provided here as we might not want navigation inside live tab yet
                    />
                </div>
            )}

            {/* 6. Head to Head (Premium Card) */}
            {h2hData.team?.head_to_head?.comp_type?.data && (
                <div style={{ padding: '0 0px' }}>
                    <H2HCard
                        teams={h2hData.team.head_to_head.comp_type.data}
                        teamIds={teamIds}
                        title="Head to Head"
                    />
                </div>
            )}

            {/* 7. Recent H2H Matches */}
            {h2hData.team?.against_last_n_matches?.result && h2hData.team.against_last_n_matches.result.length > 0 && teamIds && (
                <H2HRecentMatches
                    matches={h2hData.team.against_last_n_matches.result}
                    teamIds={teamIds}
                    teamNames={[team1?.name || '', team2?.name || '']}
                    format={match?.event_format}
                />
            )}

            {/* 8. Venue Stats (Premium Card) */}
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
