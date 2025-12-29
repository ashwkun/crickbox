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
import { WeatherIcon } from './icons/WeatherIcons';

interface LiveInsightsProps {
    match?: Match;
    h2hData: any;
    scorecard?: any;
    batsmanSplits?: BatsmanSplitsResponse | null;
    batsmanSplitsMatchups?: BatsmanSplitsResponse | null;
    overByOverMatchups?: OverByOverResponse | null;
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
    manhattanData?: { data: OverByOverResponse, label: string, color: string, id: number }[];
    manhattanInnings?: number[];
    onManhattanInningsChange?: (innings: number) => void;
    isManhattanLoading?: boolean; // Manhattan chart specific loading
    isLoading?: boolean; // Global loading state for initial data
    isWormLoading?: boolean; // Worm chart specific loading
}


const LiveInsights: React.FC<LiveInsightsProps> = ({ match, h2hData, scorecard, batsmanSplits, batsmanSplitsMatchups, overByOverMatchups, overByOver, wormPrimary, wormSecondary, wagonWheelInnings, onWagonWheelInningsChange, isWagonWheelLoading, matchupsInnings, onMatchupsInningsChange, isMatchupsLoading, partnershipsInnings = 1, onPartnershipsInningsChange, manhattanData = [], manhattanInnings = [], onManhattanInningsChange = () => { }, isManhattanLoading = false, isLoading = false, isWormLoading = false }) => {
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

    // Extract venue, pitch, weather, and officials from scorecard
    const matchDetails = scorecard?.Matchdetail;
    const venue = matchDetails?.Venue;
    const pitchDetail = venue?.Pitch_Detail;
    const weather = venue?.Venue_Weather;
    const officials = matchDetails?.Officials;

    // Helper to map API weather to icon key
    const getWeatherKey = (weatherName: string | undefined): string => {
        if (!weatherName) return 'cloud';
        const lower = weatherName.toLowerCase();
        if (lower.includes('clear') || lower.includes('sun')) return 'clear';
        if (lower.includes('partly') || lower.includes('cloud')) return 'partly-cloudy';
        if (lower.includes('overcast')) return 'overcast';
        if (lower.includes('rain') || lower.includes('shower')) return 'rain';
        if (lower.includes('drizzle')) return 'drizzle';
        if (lower.includes('storm') || lower.includes('thunder')) return 'storm';
        if (lower.includes('fog')) return 'fog';
        if (lower.includes('mist')) return 'mist';
        if (lower.includes('haze')) return 'haze';
        return 'cloud';
    };

    console.log('LiveInsights Render Debug:', { manhattanData });

    // Skeleton Placeholder Component
    const SkeletonCard = ({ height = 200 }: { height?: number }) => (
        <div className="skeleton" style={{ height, borderRadius: 16, width: '100%' }}></div>
    );

    // Show skeletons if initial loading
    if (isLoading) {
        return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <SkeletonCard height={280} /> {/* Wagon Wheel */}
                <SkeletonCard height={220} /> {/* Worm Chart */}
                <SkeletonCard height={200} /> {/* Partnerships */}
                <SkeletonCard height={240} /> {/* Matchups */}
                <SkeletonCard height={220} /> {/* Manhattan */}
                <SkeletonCard height={120} /> {/* Recent Form */}
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* === SECTION 1: MATCH SITUATION === */}

            {/* 1. Worm Chart (Score Comparison) */}
            <WormChart
                primary={wormPrimary}
                secondary={wormSecondary}
                matchFormat={match?.event_format}
                isLoading={isWormLoading}
            />

            {/* 2. Manhattan Chart (Innings Progression) */}
            <ManhattanChart
                datasets={manhattanData}
                scorecard={scorecard}
                selectedInnings={manhattanInnings}
                onInningsToggle={onManhattanInningsChange}
                isLoading={isManhattanLoading}
            />

            {/* 3. Wagon Wheel (Shot Map) */}
            <WagonWheel
                batsmanSplits={batsmanSplits || null}
                scorecard={scorecard}
                selectedInnings={wagonWheelInnings}
                onInningsChange={onWagonWheelInningsChange}
                isLoading={isWagonWheelLoading}
            />

            {/* 4. Batsman vs Bowler Matchups */}
            <BatsmanBowlerMatchups
                batsmanSplits={batsmanSplitsMatchups || batsmanSplits || null}
                overByOver={overByOverMatchups || null}
                scorecard={scorecard}
                selectedInnings={matchupsInnings}
                onInningsChange={onMatchupsInningsChange}
                isLoading={isMatchupsLoading}
            />

            {/* 5. Partnerships Chart */}
            <PartnershipsChart
                scorecard={scorecard}
                selectedInnings={partnershipsInnings}
                onInningsChange={onPartnershipsInningsChange}
            />

            {/* === SECTION 2: MATCH DEEP DIVE === */}

            {/* 6. Conditions & Info Card */}
            {(pitchDetail?.Pitch_Suited_For || pitchDetail?.Pitch_Surface || weather || officials) && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 16,
                    padding: 20,
                    border: '1px solid var(--border-color)',
                }}>
                    {/* Weather Row - Icon focused */}
                    {weather && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            marginBottom: pitchDetail || officials ? 16 : 0,
                            padding: 12,
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 12
                        }}>
                            <WeatherIcon icon={getWeatherKey(weather.Weather)} size={40} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
                                    {weather.Weather}
                                </div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                    {weather.Description}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                                {weather.Temperature && (
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                                            {weather.Temperature.replace('C', '°')}
                                        </div>
                                    </div>
                                )}
                                {weather.Humidity && (
                                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                        <div style={{ fontSize: 11, marginBottom: 2 }}>💧</div>
                                        <div style={{ fontSize: 10 }}>{weather.Humidity}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pitch Row */}
                    {(pitchDetail?.Pitch_Suited_For || pitchDetail?.Pitch_Surface) && (
                        <div style={{
                            display: 'flex',
                            gap: 12,
                            marginBottom: officials ? 16 : 0
                        }}>
                            {pitchDetail?.Pitch_Suited_For && (
                                <div style={{ flex: 1, padding: 12, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 10, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Pitch</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>{pitchDetail.Pitch_Suited_For}</div>
                                </div>
                            )}
                            {pitchDetail?.Pitch_Surface && (
                                <div style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Surface</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{pitchDetail.Pitch_Surface}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Officials Row - Minimal */}
                    {officials && (officials.Umpire1_Name || officials.Referee) && (
                        <div style={{
                            display: 'flex',
                            gap: 16,
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.4)',
                            paddingTop: (pitchDetail || weather) ? 12 : 0,
                            borderTop: (pitchDetail || weather) ? '1px solid rgba(255,255,255,0.05)' : 'none',
                            flexWrap: 'wrap',
                            justifyContent: 'center'
                        }}>
                            {officials.Umpire1_Name && (
                                <span>🧑‍⚖️ {officials.Umpire1_Name.replace(/\s*\([^)]*\)/g, '')}</span>
                            )}
                            {officials.Umpire2_Name && (
                                <span>🧑‍⚖️ {officials.Umpire2_Name.replace(/\s*\([^)]*\)/g, '')}</span>
                            )}
                            {officials.Referee && (
                                <span>📋 {officials.Referee.replace(/\s*\([^)]*\)/g, '')}</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* === SECTION 3: TEAM CONTEXT === */}

            {/* 7. Recent Form */}
            {team1?.id && team2?.id && (
                <div style={{ padding: '0 0px' }}>
                    <DualTeamRecentForm
                        team1={{ id: team1.id, name: team1.name, short_name: team1.short_name }}
                        team2={{ id: team2.id, name: team2.name, short_name: team2.short_name }}
                        currentFormat={match?.event_format || match?.match_type}
                    />
                </div>
            )}

            {/* 8. Head to Head */}
            {h2hData?.team?.head_to_head?.comp_type?.data && (
                <div style={{ padding: '0 0px' }}>
                    <H2HCard
                        teams={h2hData.team.head_to_head.comp_type.data}
                        teamIds={teamIds}
                        title="Head to Head"
                    />
                </div>
            )}

            {/* 9. Recent H2H Matches */}
            {h2hData?.team?.against_last_n_matches?.result && h2hData.team.against_last_n_matches.result.length > 0 && teamIds && (
                <H2HRecentMatches
                    matches={h2hData.team.against_last_n_matches.result}
                    teamIds={teamIds}
                    teamNames={[team1?.name || '', team2?.name || '']}
                    format={match?.event_format}
                />
            )}

            {/* 10. Venue Stats */}
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

        </div>
    );
};

export default LiveInsights;
