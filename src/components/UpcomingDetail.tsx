import React, { useEffect, useState } from 'react';
import WikiImage, { getFlagUrl } from './WikiImage';
import { Match, Participant } from '../types';
import { H2HData, SquadData } from '../utils/h2hApi';
import useCricketData from '../utils/useCricketData';
import { getTeamColor } from '../utils/teamColors';
import { useImageColor } from '../hooks/useImageColor';
import { proxyFetch, WISDEN_SCORECARD } from '../utils/api';
import { fetchWeather, WeatherData, getWeatherInfo } from '../utils/weather';
import { getWeatherIcon, RaindropIcon } from './icons/WeatherIcons';
import H2HCard from './upcoming/H2HCard';
import VenueCard from './upcoming/VenueCard';
import TeamRecentForm from './upcoming/TeamRecentForm';
// import RecentForm from './upcoming/RecentForm'; // Deprecated
import TopPlayers from './upcoming/TopPlayers';
import SquadPreview from './upcoming/SquadPreview';
import CompletedDetail from './CompletedDetail';

interface ScorecardData {
    Series_match_count?: number;
    Streaming_platform?: { Channel_name: string }[];
    Broadcasting_platform?: { Channel_name: string }[];
    Venue?: { Latitude?: string; Longitude?: string; Name?: string };
    Teams?: Record<string, { Name_Short: string; Players: Record<string, unknown> }>;
    Innings?: any[]; // For full scorecard
}

interface UpcomingDetailProps {
    match: Match;
    onClose: () => void;
    onSeriesClick?: (seriesId: string, seriesMatches?: any[]) => void;
}

const UpcomingDetail: React.FC<UpcomingDetailProps> = ({ match, onClose, onSeriesClick }) => {
    const { fetchH2H, fetchSquad } = useCricketData();
    const [h2hData, setH2hData] = useState<H2HData | null>(null);
    const [squad1, setSquad1] = useState<SquadData | null>(null);
    const [squad2, setSquad2] = useState<SquadData | null>(null);
    const [scorecardData, setScorecardData] = useState<ScorecardData | null>(null);
    const [weather, setWeather] = useState<WeatherData[]>([]);

    // Selected Match State (for Drill Down)
    const [selectedRecentMatch, setSelectedRecentMatch] = useState<Match | null>(null);
    const [selectedScorecard, setSelectedScorecard] = useState<any | null>(null);
    const [loadingScorecard, setLoadingScorecard] = useState(false);

    // Progressive Loading States
    const [loadingH2H, setLoadingH2H] = useState(true);
    const [loadingSquads, setLoadingSquads] = useState(true);
    const [selectedSquadIdx, setSelectedSquadIdx] = useState(0);

    const team1 = match.participants?.[0];
    const team2 = match.participants?.[1];

    // Dynamic Hero Styling
    const t1Logo = getFlagUrl(team1?.name);
    const t2Logo = getFlagUrl(team2?.name);
    // Use slightly transparent extracted colors or map colors
    const c1Ext = useImageColor(t1Logo || undefined);
    const c2Ext = useImageColor(t2Logo || undefined);

    // Ensure we have a hex string for opacity manipulation
    const hex1 = getTeamColor(team1?.name) || c1Ext || '#3b82f6';
    const hex2 = getTeamColor(team2?.name) || c2Ext || '#ef4444';

    // Hero Card with subtle team color ambiance
    const heroStyle: React.CSSProperties = {
        position: 'relative',
        overflow: 'hidden',
        // Solid dark background
        backgroundColor: '#0f0f14',
        // Soft, contained team color ambient glows (inside card, not at edges)
        backgroundImage: `
            radial-gradient(ellipse 50% 60% at 10% 50%, ${hex1}25 0%, transparent 100%),
            radial-gradient(ellipse 50% 60% at 90% 50%, ${hex2}25 0%, transparent 100%)
        `,
        borderRadius: '20px',
        padding: '24px',
        // Simple white border, no color
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    };

    // Countdown calculation
    const matchDate = new Date(match.start_date);
    const now = new Date();
    const diffMs = matchDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    useEffect(() => {
        const loadData = async () => {
            if (!match.game_id) return;

            // Fetch H2H and Scorecard in PARALLEL for faster loading
            const [h2hResult, scorecardResult] = await Promise.allSettled([
                fetchH2H(match.game_id),
                proxyFetch(`${WISDEN_SCORECARD}${match.game_id}`)
            ]);

            // Process H2H
            if (h2hResult.status === 'fulfilled') {
                setH2hData(h2hResult.value);
            }
            setLoadingH2H(false);

            // Process Scorecard
            if (scorecardResult.status === 'fulfilled') {
                const scData = scorecardResult.value;
                const details = scData?.data?.Matchdetail;
                const series = details?.Series;
                const venue = details?.Venue;

                if (series || venue) {
                    setScorecardData({
                        Series_match_count: series?.Series_match_count,
                        Streaming_platform: series?.Streaming_platform || [],
                        Broadcasting_platform: series?.Broadcasting_platform || [],
                        Venue: venue,
                        Teams: scData?.data?.Teams
                    });

                    // Fetch Weather using venue coordinates (fast, no proxy needed)
                    if (venue?.Latitude && venue?.Longitude) {
                        const lat = parseFloat(venue.Latitude);
                        const lon = parseFloat(venue.Longitude);
                        fetchWeather(lat, lon, 7).then(setWeather);
                    }
                }
            }

            // HYBRID SQUAD APPROACH: Try Scorecard first, fallback to H2H per team
            if (team1?.id && team2?.id) {
                try {
                    // Check if Scorecard has squad data
                    const scorecardTeams = scorecardResult.status === 'fulfilled'
                        ? scorecardResult.value?.data?.Teams
                        : null;

                    // Get player counts from Scorecard
                    const team1ScorecardPlayers: any = scorecardTeams ?
                        Object.entries(scorecardTeams).find(([_, t]: [string, any]) =>
                            t.Name_Short === team1.short_name || t.Name_Full?.includes(team1.name)
                        )?.[1] : null;
                    const team2ScorecardPlayers: any = scorecardTeams ?
                        Object.entries(scorecardTeams).find(([_, t]: [string, any]) =>
                            t.Name_Short === team2.short_name || t.Name_Full?.includes(team2.name)
                        )?.[1] : null;

                    const team1Count = team1ScorecardPlayers?.Players ? Object.keys(team1ScorecardPlayers.Players).length : 0;
                    const team2Count = team2ScorecardPlayers?.Players ? Object.keys(team2ScorecardPlayers.Players).length : 0;

                    // Convert Scorecard format to SquadData format
                    const scorecardToSquad = (teamData: any, teamInfo: any): SquadData | null => {
                        if (!teamData?.Players || Object.keys(teamData.Players).length === 0) return null;
                        return {
                            team_id: parseInt(teamInfo.id),
                            team_name: teamData.Name_Full || teamInfo.name,
                            team_short_name: teamData.Name_Short || teamInfo.short_name,
                            players: Object.entries(teamData.Players)
                                .sort((a: any, b: any) => parseInt(a[1].Position || '99') - parseInt(b[1].Position || '99'))
                                .map(([playerId, p]: [string, any]) => ({
                                    player_id: parseInt(playerId),
                                    player_name: p.Name_Full,
                                    short_name: p.Name_Short || p.Name_Full,
                                    role: p.Role || p.Skill_Name,
                                    skill: p.Skill_Name,
                                    is_captain: p.Iscaptain === true || p.Iscaptain === 'true',
                                    is_keeper: p.Iskeeper === true || p.Iskeeper === 'true'
                                }))
                        };
                    };

                    // Team 1: Use Scorecard if available, else H2H
                    let finalSquad1: SquadData | null = null;
                    if (team1Count > 0) {
                        finalSquad1 = scorecardToSquad(team1ScorecardPlayers, team1);
                    } else {
                        finalSquad1 = await fetchSquad(team1.id, match.series_id);
                    }

                    // Team 2: Use Scorecard if available, else H2H
                    let finalSquad2: SquadData | null = null;
                    if (team2Count > 0) {
                        finalSquad2 = scorecardToSquad(team2ScorecardPlayers, team2);
                    } else {
                        finalSquad2 = await fetchSquad(team2.id, match.series_id);
                    }

                    setSquad1(finalSquad1);
                    setSquad2(finalSquad2);
                } catch (err) {
                    console.error("Failed to load Squads", err);
                }
            }
            setLoadingSquads(false);
        };

        loadData();
    }, [match.game_id, match.series_id, team1?.id, team2?.id]);

    // Handle clicking a recent match
    const handleRecentMatchClick = async (gameId: string) => {
        setLoadingScorecard(true);
        try {
            // 1. Find the match in H2H list to build the hero object
            const recentMatches = h2hData?.team?.against_last_n_matches?.result || [];
            const rMatch = recentMatches.find(m => m.file_name === gameId);

            if (rMatch) {
                // Construct a Match object compatible with CompletedDetail
                const participants: Participant[] = [
                    {
                        id: (rMatch.winner_team_id || rMatch.home_team_id || 0).toString(),
                        name: rMatch.winner_team_name || rMatch.home_team_name || 'Team 1',
                        short_name: rMatch.winner_team_name?.slice(0, 3).toUpperCase() || 'T1',
                        value: ''
                    },
                    {
                        id: (rMatch.loser_team_id || rMatch.away_team_id || 0).toString(),
                        name: rMatch.loser_team_name || rMatch.away_team_name || 'Team 2',
                        short_name: rMatch.loser_team_name?.slice(0, 3).toUpperCase() || 'T2',
                        value: ''
                    }
                ];

                const constructedMatch: Match = {
                    game_id: rMatch.file_name,
                    sport: match.sport,
                    series_id: '',
                    series_name: rMatch.match_number ? `Match ${rMatch.match_number}` : 'Recent Result',
                    start_date: rMatch.match_start_date,
                    event_state: 'C',
                    event_status: 'Completed',
                    event_format: match.event_format,
                    result: rMatch.result,
                    venue: rMatch.venue_name,
                    participants: participants
                };

                setSelectedRecentMatch(constructedMatch);

                // 2. Fetch Scorecard
                const scUrl = `${WISDEN_SCORECARD}${gameId}`;
                const scData = await proxyFetch(scUrl);
                setSelectedScorecard(scData);
            }
        } catch (e) {
            console.error("Error loading recent match details", e);
        } finally {
            setLoadingScorecard(false);
        }
    };

    // If viewing a drilled-down match
    if (selectedRecentMatch && selectedScorecard) {
        return (
            <div className="upcoming-detail" style={{ zIndex: 2100 }}>
                <CompletedDetail
                    match={selectedRecentMatch}
                    scorecard={selectedScorecard}
                    onClose={() => {
                        setSelectedRecentMatch(null);
                        setSelectedScorecard(null);
                    }}
                />
            </div>
        );
    }

    // Show loading overlay if fetching drill down
    if (loadingScorecard) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.85)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div className="spinner"></div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>Loading Scorecard...</div>
                </div>
            </div>
        );
    }

    // Helper: "TEST 4 of 5" or "Match 13" format - uses Scorecard API Series_match_count
    const getMatchOfSeries = () => {
        const format = match.event_format?.toUpperCase() || '';

        if (!match.event_name) return format;

        // Pattern 1: Ordinal format like "4th Test", "1st ODI"
        const ordinalMatch = match.event_name.match(/(\d+)(st|nd|rd|th)/i);

        // Pattern 2: Tournament format like "Match 13", "Match 45"
        const tournamentMatch = match.event_name.match(/Match\s*(\d+)/i);

        if (ordinalMatch) {
            const matchNum = parseInt(ordinalMatch[1]);

            // Priority 1: Use Scorecard API's Series_match_count for series
            if (scorecardData?.Series_match_count) {
                return `${format} ${matchNum} of ${scorecardData.Series_match_count}`;
            }

            // Priority 2: Extract total from series_name (e.g., "5 Test Series")
            const totalMatch = match.series_name?.match(/(\d+)\s*(Test|T20I?|ODI)/i);
            if (totalMatch) {
                return `${format} ${matchNum} of ${parseInt(totalMatch[1])}`;
            }

            return format ? `${format} ${matchNum}` : match.event_name;
        }

        if (tournamentMatch) {
            // For tournaments, just show "Match 13" (not "Match 13 of 74")
            return match.event_name;
        }

        return format ? `${format}` : match.event_name;
    };

    return (
        <div className="upcoming-detail">
            {/* Full Width Hero Card - Matching LiveDetail style */}
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

                {/* Row 2: Chips - Match format only */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                }}>
                    {/* Match format chip (pill-shaped like LiveDetail) */}
                    {match.event_name && (
                        <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '4px 10px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            borderRadius: 20,
                            color: '#3b82f6',
                        }}>
                            {getMatchOfSeries()}
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
                            style={{ maxHeight: 60, width: 'auto', height: 'auto' }}
                        />
                        <span className="upcoming-team-name left">
                            {team1?.name}
                        </span>
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
                            style={{ maxHeight: 60, width: 'auto', height: 'auto' }}
                        />
                        <span className="upcoming-team-name right">
                            {team2?.name}
                        </span>
                    </div>
                </div>
            </div>

            {/* Enhanced Countdown Card with Weather & Streaming */}
            <div className="upcoming-countdown" style={{ padding: '16px 20px' }}>
                {/* Main Row: Countdown (left) + Date/Venue (center) + Weather (right) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    {/* Match Start Time - Prominent */}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Match Starts</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                            {matchDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        <div style={{ fontSize: '14px', color: '#22c55e', fontWeight: 600, marginTop: '2px' }}>
                            {matchDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </div>
                        {diffDays > 0 && (
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                                {diffDays} {diffDays === 1 ? 'day' : 'days'} to go
                            </div>
                        )}
                    </div>

                    {/* Weather - Right */}
                    <div style={{
                        minWidth: '80px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        gap: '4px'
                    }}>
                        {weather.length > 0 ? (() => {
                            const matchDateStr = matchDate.toISOString().split('T')[0];
                            const matchWeather = weather.find(w => w.date === matchDateStr) || weather[0];
                            const weatherInfo = getWeatherInfo(matchWeather.weatherCode);
                            return (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {getWeatherIcon(weatherInfo.icon, 28)}
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{matchWeather.tempMax}°C</div>
                                    {matchWeather.rainProbability > 0 && (
                                        <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <RaindropIcon size={10} /> {matchWeather.rainProbability}%
                                        </div>
                                    )}
                                </>
                            );
                        })() : (
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>...</div>
                        )}
                    </div>
                </div>

                {/* Streaming & Broadcasting Badges */}
                {(scorecardData?.Streaming_platform?.length || scorecardData?.Broadcasting_platform?.length) ? (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>Watch:</span>
                        {scorecardData?.Streaming_platform?.map((p, i) => (
                            <span key={`s-${i}`} style={{
                                fontSize: '9px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                background: 'rgba(168, 85, 247, 0.2)',
                                borderRadius: '4px',
                                color: '#c084fc'
                            }}>{p.Channel_name}</span>
                        ))}
                        {scorecardData?.Broadcasting_platform?.map((p, i) => (
                            <span key={`b-${i}`} style={{
                                fontSize: '9px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                background: 'rgba(59, 130, 246, 0.2)',
                                borderRadius: '4px',
                                color: '#60a5fa'
                            }}>{p.Channel_name}</span>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* H2H Section */}
            {!loadingH2H && h2hData && match.participants && (
                <div className="section-container fade-in">
                    <H2HCard teams={h2hData.team?.head_to_head?.comp_type?.data || []} />

                    {/* NEW: Recent Form (Split by Team + Format) */}
                    <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {team1?.id && (
                            <TeamRecentForm
                                teamId={team1.id}
                                teamName={team1.name}
                                currentFormat={match.event_format}
                                onMatchClick={handleRecentMatchClick} // This works because handleRecentMatchClick fetches card details
                            />
                        )}
                        {team2?.id && (
                            <TeamRecentForm
                                teamId={team2.id}
                                teamName={team2.name}
                                currentFormat={match.event_format}
                                onMatchClick={handleRecentMatchClick}
                            />
                        )}
                    </div>

                    {/* Venue Stats Card */}
                    {h2hData.team?.head_to_head?.venue && (
                        <div className="mt-4">
                            <VenueCard
                                venue={h2hData.team.head_to_head.venue}
                                pitchDetails={scorecardData?.Venue as { Pitch_Suited_For?: string; Pitch_Surface?: string } | undefined}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Skeleton Loading for H2H - Only when loading */}
            {loadingH2H && (
                <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="skeleton" style={{ height: '180px', borderRadius: '16px' }}></div>
                    <div className="skeleton" style={{ height: '260px', borderRadius: '16px' }}></div>
                    <div className="skeleton" style={{ height: '100px', borderRadius: '16px' }}></div>
                </div>
            )}

            {/* Squads Section - Now AFTER Recent Form */}
            {!loadingSquads && (squad1 || squad2) && (() => {
                const squads = [squad1, squad2].filter(Boolean) as SquadData[];
                const selectedSquad = squads[selectedSquadIdx] || squads[0];
                if (!selectedSquad) return null;

                return (
                    <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Squads</div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            {squads.map((sq, idx) => (
                                <button
                                    key={sq.team_id || idx}
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
                                    {sq.team_short_name || sq.team_name}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {selectedSquad.players?.map((player, idx) => (
                                <div key={player.player_id || idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <WikiImage name={player.short_name || player.player_name} id={player.player_id?.toString()} type="player" style={{ width: 32, height: 32 }} circle={true} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
                                            {player.short_name || player.player_name}
                                            {player.is_captain && <span style={{ color: '#22c55e', marginLeft: 6, fontSize: 10 }}>C</span>}
                                            {player.is_keeper && <span style={{ color: '#60a5fa', marginLeft: 6, fontSize: 10 }}>WK</span>}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                                        {player.role || player.skill || ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* Skeleton Loading for Squads - Only when H2H is done but squads still loading */}
            {!loadingH2H && loadingSquads && (
                <div className="section-container">
                    <div className="skeleton" style={{ height: '200px', borderRadius: '16px' }}></div>
                </div>
            )}
        </div>
    );
};

export default UpcomingDetail;
