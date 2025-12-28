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
import BatsmanBowlerMatchups from './insights/BatsmanBowlerMatchups';

interface LiveInsightsProps {
    match?: Match;
    h2hData: any;
    scorecard?: any;
    batsmanSplits?: BatsmanSplitsResponse | null;
    batsmanSplitsMatchups?: BatsmanSplitsResponse | null; // Independent data for Matchups
    overByOver?: OverByOverResponse | null;
    overByOver1?: OverByOverResponse | null;
    overByOver2?: OverByOverResponse | null;
    wagonWheelInnings?: number;
    onWagonWheelInningsChange?: (innings: number) => void;
    isWagonWheelLoading?: boolean;
    matchupsInnings?: number;
    onMatchupsInningsChange?: (innings: number) => void;
    isMatchupsLoading?: boolean;
}


const LiveInsights: React.FC<LiveInsightsProps> = ({ match, h2hData, scorecard, batsmanSplits, batsmanSplitsMatchups, overByOver, overByOver1, overByOver2, wagonWheelInnings, onWagonWheelInningsChange, isWagonWheelLoading, matchupsInnings, onMatchupsInningsChange, isMatchupsLoading }) => {
    const [manhattanInnings, setManhattanInnings] = useState<1 | 2>(1);
    if (!h2hData) return null;

    const team1 = match?.participants?.[0];
    const team2 = match?.participants?.[1];

    // Helper to get definitive short name (matches WagonWheel logic)
    const getShortName = (team: any) => {
        if (!team?.id) return 'T1';
        // 1. Try Scorecard Data (most accurate, used in WagonWheel)
        if (scorecard?.Teams?.[team.id]?.Name_Short) {
            return scorecard.Teams[team.id].Name_Short;
        }
        // 2. Try Match Participant Data
        if (team.short_name) return team.short_name;
        // 3. Try "Value" field
        if (team.value && team.value.length >= 2 && team.value.length <= 4) return team.value;
        // 4. Fallback
        return team.name?.substring(0, 3).toUpperCase() || 'TM';
    };

    const t1Short = getShortName(team1);
    const t2Short = getShortName(team2);

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
                team1ShortName={t1Short}
                team2ShortName={t2Short}
                matchFormat={match?.event_format}
                team1Id={team1?.id}
                team2Id={team2?.id}
            />

            {/* Partnerships Chart */}
            <PartnershipsChart scorecard={scorecard} />

            {/* Batsman vs Bowler Matchups */}
            <BatsmanBowlerMatchups
                batsmanSplits={batsmanSplitsMatchups || batsmanSplits || null}
                scorecard={scorecard}
                selectedInnings={matchupsInnings}
                onInningsChange={onMatchupsInningsChange}
                isLoading={isMatchupsLoading}
            />

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
