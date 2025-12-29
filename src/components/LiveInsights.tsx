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
import ManhattanChart from './insights/ManhattanChart';
import BatsmanBowlerMatchups from './insights/BatsmanBowlerMatchups';

interface LiveInsightsProps {
    match?: Match;
    h2hData: any;
    scorecard?: any;
    batsmanSplits?: BatsmanSplitsResponse | null;
    batsmanSplitsMatchups?: BatsmanSplitsResponse | null; // Independent data for Matchups
    overByOverMatchups?: OverByOverResponse | null; // Independent data for Matchups Wickets
    overByOver?: OverByOverResponse | null;
    overByOverMatchups?: OverByOverResponse | null; // Independent data for Matchups Wickets
    overByOver?: OverByOverResponse | null;
    wormPrimary?: { data: OverByOverResponse | null, label: string, color: string } | null;
    wormSecondary?: { data: OverByOverResponse | null, label: string, color: string } | null;
    wagonWheelInnings?: number;
    onWagonWheelInningsChange?: (innings: number) => void;
    isWagonWheelLoading?: boolean;
    matchupsInnings?: number;
    onMatchupsInningsChange?: (innings: number) => void;
    isMatchupsLoading?: boolean;
    partnershipsInnings?: number;
    onPartnershipsInningsChange?: (innings: number) => void;
    // Manhattan
    manhattanData?: { data: OverByOverResponse, label: string, color: string, id: number }[];
    manhattanInnings?: number[];
    onManhattanInningsChange?: (innings: number) => void;
}


const LiveInsights: React.FC<LiveInsightsProps> = ({ match, h2hData, scorecard, batsmanSplits, batsmanSplitsMatchups, overByOverMatchups, overByOver, wormPrimary, wormSecondary, wagonWheelInnings, onWagonWheelInningsChange, isWagonWheelLoading, matchupsInnings, onMatchupsInningsChange, isMatchupsLoading, partnershipsInnings = 1, onPartnershipsInningsChange, manhattanData = [], manhattanInnings = [], onManhattanInningsChange = () => { } }) => {
    // if (!h2hData) return null; // Removed to allow Matchups to show even if H2H fails

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

    console.log('LiveInsights Render Debug:', { manhattanData });

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
                primary={wormPrimary}
                secondary={wormSecondary}
                matchFormat={match?.event_format}
            />

            {/* Partnerships Chart */}
            <PartnershipsChart
                scorecard={scorecard}
                selectedInnings={partnershipsInnings}
                onInningsChange={onPartnershipsInningsChange}
            />

            {/* Batsman vs Bowler Matchups */}
            <BatsmanBowlerMatchups
                batsmanSplits={batsmanSplitsMatchups || batsmanSplits || null}
                overByOver={overByOverMatchups || null} // Strict: Do not fallback to main overByOver as it might be wrong innings
                scorecard={scorecard}
                selectedInnings={matchupsInnings}
                onInningsChange={onMatchupsInningsChange}
                isLoading={isMatchupsLoading}
            />

            {/* Innings Progression (Manhattan) */}
            <ManhattanChart
                datasets={manhattanData}
                scorecard={scorecard}
                selectedInnings={manhattanInnings}
                onInningsToggle={onManhattanInningsChange}
            />

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
            {h2hData?.team?.head_to_head?.comp_type?.data && (
                <div style={{ padding: '0 0px' }}>
                    <H2HCard
                        teams={h2hData.team.head_to_head.comp_type.data}
                        teamIds={teamIds}
                        title="Head to Head"
                    />
                </div>
            )}

            {/* 7. Recent H2H Matches */}
            {h2hData?.team?.against_last_n_matches?.result && h2hData.team.against_last_n_matches.result.length > 0 && teamIds && (
                <H2HRecentMatches
                    matches={h2hData.team.against_last_n_matches.result}
                    teamIds={teamIds}
                    teamNames={[team1?.name || '', team2?.name || '']}
                    format={match?.event_format}
                />
            )}

            {/* 8. Venue Stats (Premium Card) */}
            {h2hData?.team?.head_to_head?.venue && (
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
