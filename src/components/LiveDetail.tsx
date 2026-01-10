import React, { useState, useEffect } from 'react';
import LiveInsights from './LiveInsights';
import CompletedDetail from './CompletedDetail';
import WikiImage, { getFlagUrl } from './WikiImage';
import { WallstreamData } from '../utils/wallstreamApi';
import { getTeamColor } from '../utils/teamColors';
import { getMatchStatusConfig } from '../utils/matchStatus';
import { GiCricketBat } from 'react-icons/gi';
import { IoBaseball } from 'react-icons/io5';
import { FaMapMarkerAlt } from 'react-icons/fa';
import useCricketData from '../utils/useCricketData';
import { H2HData, BatsmanSplitsResponse, OverByOverResponse } from '../utils/h2hApi';
import { Match, Scorecard, WallstreamData, Participant } from '../types';
import { HeaderDisplayData } from './FloatingHeader';
import { proxyFetch, WISDEN_SCORECARD } from '../utils/api';
import { calculatePreMatchProbability, calculateLiveProbability, WinProbabilityResult } from '../utils/winProbability';
import { getTeamForm } from '../utils/matchDatabase';
import WinProbabilityBar from './WinProbabilityBar';

interface LiveDetailProps {
    match: any;
    scorecard: any;
    wallstream?: WallstreamData | null;
    onClose: () => void;
    onSeriesClick?: (seriesId: string, seriesMatches?: any[]) => void;
    setHeaderData: (data: HeaderDisplayData | null) => void;
    isVisible?: boolean;
}

const LiveDetail: React.FC<LiveDetailProps> = ({ match, scorecard, wallstream, onClose, onSeriesClick, setHeaderData, isVisible = true }) => {
    const { fetchH2H, fetchBatsmanSplits, fetchOverByOver } = useCricketData();
    const [selectedSquadIdx, setSelectedSquadIdx] = React.useState(0);

    // Score Tracking for Animations (State & Ref)
    const prevScores = React.useRef<{ t1: string, t2: string }>({ t1: '', t2: '' });
    const [scoreTicker1, setScoreTicker1] = React.useState<{ text: string, type: 'runs' | 'wicket', key: number } | null>(null);
    const [scoreTicker2, setScoreTicker2] = React.useState<{ text: string, type: 'runs' | 'wicket', key: number } | null>(null);

    // This Over ripple effect
    const [thisOverRipple, setThisOverRipple] = React.useState<{ color: string, key: number } | null>(null);
    const [newBallIndex, setNewBallIndex] = React.useState<number | null>(null);
    const [heroFlash, setHeroFlash] = React.useState<{ color: string, key: number } | null>(null);
    const prevBallCount = React.useRef<number>(-1); // Start at -1 to detect first load

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
    const [wagonWheelInnings, setWagonWheelInnings] = useState(scorecard?.Innings?.length || 1); // Independent of scorecard tabs
    const [isWagonWheelLoading, setIsWagonWheelLoading] = useState(false);
    const [commentaryExpanded, setCommentaryExpanded] = useState(false);
    const [h2hData, setH2hData] = useState<H2HData | null>(null);
    const [batsmanSplits, setBatsmanSplits] = useState<BatsmanSplitsResponse | null>(null); // For Wagon Wheel (legacy name)
    const [batsmanSplitsMatchups, setBatsmanSplitsMatchups] = useState<BatsmanSplitsResponse | null>(null); // Independent for Matchups
    const [overByOverMatchups, setOverByOverMatchups] = useState<OverByOverResponse | null>(null); // Independent for Matchups Wickets
    const [matchupsInnings, setMatchupsInnings] = useState(scorecard?.Innings?.length || 1);
    const [isMatchupsLoading, setIsMatchupsLoading] = useState(false);
    const [partnershipsInnings, setPartnershipsInnings] = useState(scorecard?.Innings?.length || 1);
    const [overByOver, setOverByOver] = useState<OverByOverResponse | null>(null);
    const [overByOver1, setOverByOver1] = useState<OverByOverResponse | null>(null);
    const [overByOver2, setOverByOver2] = useState<OverByOverResponse | null>(null);
    // Manhattan State
    const [manhattanInnings, setManhattanInnings] = useState<number[]>([]);
    const [manhattanData, setManhattanData] = useState<{ data: OverByOverResponse, label: string, color: string, id: number }[]>([]);
    const [isManhattanLoading, setIsManhattanLoading] = useState(false);

    // Smart Worm State
    const [wormPrimary, setWormPrimary] = useState<{ data: OverByOverResponse | null, label: string, color: string } | null>(null);
    const [wormSecondary, setWormSecondary] = useState<{ data: OverByOverResponse | null, label: string, color: string } | null>(null);
    const [isWormLoading, setIsWormLoading] = useState(true); // Start as loading

    const [activeTab, setActiveTab] = useState<'live' | 'insights'>('live');
    const hasSetInitialTab = React.useRef(false);

    // Drill-down state for Recent H2H Match click
    const [selectedRecentMatch, setSelectedRecentMatch] = useState<Match | null>(null);
    const [selectedRecentScorecard, setSelectedRecentScorecard] = useState<any>(null);
    const [isLoadingRecentMatch, setIsLoadingRecentMatch] = useState(false);
    const [showStickyHeader, setShowStickyHeader] = useState(false);

    // Win Probability State
    const [winProb, setWinProb] = useState<WinProbabilityResult | null>(null);
    const [preMatchProb, setPreMatchProb] = useState<WinProbabilityResult | null>(null);
    const [h2hPlayerData, setH2hPlayerData] = useState<any>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        if (scrollTop > 260) {
            setShowStickyHeader(true);
        } else {
            setShowStickyHeader(false);
        }
    };

    // 1. Calculate Pre-Match Probability (Base)
    useEffect(() => {
        const loadBaseProb = async () => {
            if (!match.game_id || preMatchProb) return; // Don't reload if already have base

            const team1 = match.participants?.[0];
            const team2 = match.participants?.[1];
            if (!team1?.id || !team2?.id) return;

            const [h2hRes] = await Promise.allSettled([
                fetchH2H(match.game_id)
            ]);

            let h2hStats = { matches_played: '0', won: '0', lost: '0' };

            // Process H2H result
            let h2hVal: any = null;
            if (h2hRes.status === 'fulfilled' && h2hRes.value) {
                h2hVal = h2hRes.value;
                if (h2hVal?.team?.head_to_head?.comp_type?.data) {
                    const opponentStat = h2hVal.team.head_to_head.comp_type.data.find(
                        (op: any) => String(op.id) === String(team2.id)
                    );
                    if (opponentStat) {
                        h2hStats = {
                            matches_played: String(opponentStat.matches_played || 0),
                            won: String(opponentStat.won || 0),
                            lost: String(opponentStat.lost || 0)
                        };
                    }
                }
            }

            // Extract Venue-specific H2H
            let venueH2H = {};
            if (h2hVal?.team?.head_to_head?.venue?.data) {
                const venueData = h2hVal.team.head_to_head.venue.data;
                const team1VenueStat = venueData.find((t: any) => String(t.id) === String(team1.id));
                const team2VenueStat = venueData.find((t: any) => String(t.id) === String(team2.id));
                if (team1VenueStat && team2VenueStat) {
                    venueH2H = {
                        team1_matches: team1VenueStat.matches_played || 0,
                        team1_win_pct: team1VenueStat.win_percentage || 50,
                        team2_matches: team2VenueStat.matches_played || 0,
                        team2_win_pct: team2VenueStat.win_percentage || 50
                    };
                }
            }

            const id1 = team1.id;
            const id2 = team2.id;

            // Fetch Form with Format Filtering
            const format = match.event_format || 't20'; // Default t20
            const form1 = await getTeamForm(id1, 5, format);
            const form2 = await getTeamForm(id2, 5, format);

            const isMounted = true; // Placeholder, in a real component you'd use a ref or state for this

            if (!isMounted) return;

            const f1 = form1;
            const f2 = form2;

            const isInternational = match.league_code === 'icc' ||
                match.league_code === 'womens_international' ||
                match.league_code === 'youth_international';

            const isFranchise = !isInternational;

            // Pitch detail from initial scorecard prop if available
            const pitch = scorecard?.Matchdetail?.Venue?.Pitch_Detail || {};
            const homeTeamId = scorecard?.Matchdetail?.Team_Home;

            const prob = calculatePreMatchProbability(
                team1 as any,
                team2 as any,
                h2hStats,
                f1,
                f2,
                venueH2H,
                pitch,
                match.venue_name || "",
                isFranchise,
                homeTeamId,
                h2hVal // Full H2H data for player strength analysis
            );

            setPreMatchProb(prob);
            setH2hPlayerData(h2hVal); // Store for live calculation
            setWinProb(prob); // Initialize win prob with pre-match
        };

        loadBaseProb();
    }, [match.game_id, scorecard?.Matchdetail?.Venue?.Pitch_Detail]); // Recalculate when pitch data becomes available

    // 2. Calculate Live Probability (on Scorecard update)
    useEffect(() => {
        if (!preMatchProb || !scorecard?.Innings) return;

        // Current Innings index
        // If match is live, likely the last inning in the list is active
        const currentInningsIdx = scorecard.Innings.length - 1;

        // Determine format
        // Determine format
        const type = scorecard.Matchdetail?.Match?.Type?.toUpperCase() || ''; // T20, ODI, TEST
        const code = scorecard.Matchdetail?.Match?.Code?.toUpperCase() || '';
        const league = scorecard.Matchdetail?.Match?.League?.toUpperCase() || '';

        let format: 'T20' | 'ODI' | 'Test' = 'T20';

        if (code.includes('TEST') || type.includes('TEST') || type.includes('First Class') || type.includes('FC') || league.includes('TEST')) {
            format = 'Test';
        } else if (type.includes('ODI') || type.includes('ONE DAY') || type.includes('LIST A') || league.includes('ODI')) {
            format = 'ODI';
        }

        // Get team IDs for team strength calculation
        const team1 = match.participants?.[0];
        const team2 = match.participants?.[1];

        const live = calculateLiveProbability(
            preMatchProb,
            scorecard,
            currentInningsIdx,
            format,
            h2hPlayerData, // Full H2H data for team strength
            team1?.id,
            team2?.id,
            overByOver // OBO data for momentum calculation
        );
        setWinProb(live);

    }, [scorecard, preMatchProb, h2hPlayerData, overByOver]);

    // 2b. Initialize Manhattan Innings Selection (based on scorecard, runs once per innings change)
    useEffect(() => {
        if (!scorecard?.Innings || scorecard.Innings.length === 0) return;
        const currentInningsLen = scorecard.Innings.length;

        // Only initialize if empty (first load or reset)
        if (manhattanInnings.length === 0) {
            let initialSelection = [currentInningsLen];

            // If 2nd innings+, auto-select opponent's previous innings for comparison
            if (currentInningsLen > 1) {
                const currentTeam = scorecard.Innings[currentInningsLen - 1].Battingteam;
                for (let i = currentInningsLen - 2; i >= 0; i--) {
                    if (scorecard.Innings[i].Battingteam !== currentTeam) {
                        initialSelection = [i + 1, currentInningsLen];
                        break;
                    }
                }
            }
            setManhattanInnings(initialSelection);
        }
    }, [scorecard?.Innings?.length]); // Only trigger on innings length change

    // Helper to get Label/Color (Reused)
    const getInningsMeta = (inningIdx: number) => { // 0-based index input
        if (!scorecard?.Innings?.[inningIdx]) return { label: `INN ${inningIdx + 1}`, color: '#ccc' };
        const inn = scorecard.Innings[inningIdx];
        const teamId = inn.Battingteam;
        const team = scorecard.Teams?.[teamId];
        const label = `${team?.Name_Short || 'TM'} ${Math.floor(inningIdx / 2) + 1}`;
        const color = getTeamColor(team?.Name_Full || team?.Name_Short) || '#3b82f6';
        return { label, color };
    };

    // --- DATA FETCHING STRATEGY ---
    // 1. Static/One-time Data (H2H, Squads, etc.)
    useEffect(() => {
        if (match?.game_id) {
            // Fetch H2H data
            fetchH2H(match.game_id).then(data => {
                if (data) setH2hData(data);
            });
        }
    }, [match?.game_id, fetchH2H]);

    // Derived state for dependency: Current Overs (String) to trigger updates
    // Use string to avoid float comparison issues, change on every ball
    const currentOversStr = scorecard?.Innings?.[scorecard.Innings.length - 1]?.Overs || "0";

    // 2. Real-time/Live Data (Charts, Splits, OBO) - Re-runs on every ball/over change
    useEffect(() => {
        if (match?.game_id) {
            const currentInningsLen = scorecard?.Innings?.length || 1;

            // console.log(`[LIVE UPDATE] Refreshing insights for ${currentOversStr} overs (Inn ${currentInningsLen})`);

            // A. Fetch Batsman Splits (Wagon Wheel, Matchups)
            fetchBatsmanSplits(match.game_id, currentInningsLen).then(data => {
                if (data) {
                    setBatsmanSplits(data);
                    setBatsmanSplitsMatchups(data);
                }

                // Initialize active tab states if not set (only on first valid load)
                if (currentInningsLen > 0 && batsmanSplits === null) {
                    setWagonWheelInnings(currentInningsLen);
                    setMatchupsInnings(currentInningsLen);
                    setPartnershipsInnings(currentInningsLen);
                    // Note: manhattanInnings initialized in dedicated useEffect
                }
            });

            // B. Fetch OBO (Manhattan, Worm, Matchups Wickets)
            fetchOverByOver(match.game_id, currentInningsLen).then(data => {
                if (data) {
                    setOverByOver(data);
                    setOverByOverMatchups(data);

                    // Manhattan OBO data update
                    if (scorecard?.Innings) {
                        const idx = currentInningsLen;
                        const meta = getInningsMeta(idx - 1);

                        setManhattanData(prev => {
                            const filtered = prev.filter(p => p.id !== idx);
                            const newData = [...filtered, {
                                data,
                                label: meta.label,
                                color: meta.color,
                                id: idx
                            }].sort((a, b) => a.id - b.id);
                            return newData;
                        });
                        // Note: manhattanInnings initialized in dedicated useEffect
                    }
                }
            });

            // C. Smart Worm Logic (Recalculate on every update)
            if (!wormPrimary) setIsWormLoading(true); // Only show loader on initial fetch

            if (scorecard?.Innings?.length) {
                const innings = scorecard.Innings;
                const primaryIdx = innings.length - 1;
                const primaryInn = innings[primaryIdx];
                const primaryTeamId = primaryInn.Battingteam;

                let secondaryIdx = -1;
                for (let i = primaryIdx - 1; i >= 0; i--) {
                    if (innings[i].Battingteam !== primaryTeamId) {
                        secondaryIdx = i;
                        break;
                    }
                }

                // Helper to get Label/Color
                const getMeta = (idx: number) => {
                    const inn = innings[idx];
                    const teamId = inn.Battingteam;
                    const team = scorecard.Teams?.[teamId];
                    const label = `${team?.Name_Short || 'TM'} ${Math.floor(idx / 2) + 1}`;
                    const color = getTeamColor(team?.Name_Full || team?.Name_Short) || '#3b82f6';
                    return { label, color };
                };

                const fetchPrimary = fetchOverByOver(match.game_id, primaryIdx + 1);
                const fetchSecondaryPromise = secondaryIdx !== -1
                    ? fetchOverByOver(match.game_id, secondaryIdx + 1)
                    : Promise.resolve(null);

                Promise.all([fetchPrimary, fetchSecondaryPromise]).then(([primaryData, secondaryData]) => {
                    if (primaryData) {
                        const meta = getMeta(primaryIdx);
                        setWormPrimary({ data: primaryData, label: meta.label, color: meta.color });
                    }
                    if (secondaryData && secondaryIdx !== -1) {
                        const meta = getMeta(secondaryIdx);
                        setWormSecondary({ data: secondaryData, label: meta.label, color: meta.color });
                    } else if (secondaryIdx === -1) {
                        setWormSecondary(null);
                    }
                    setIsWormLoading(false);
                });
            } else {
                // Fallback
                fetchOverByOver(match.game_id, 1).then(data => {
                    if (data) setWormPrimary({ data, label: 'INN 1', color: '#3b82f6' });
                    setIsWormLoading(false);
                });
            }
        }
    }, [match?.game_id, scorecard?.Innings?.length, currentOversStr, fetchBatsmanSplits, fetchOverByOver]);


    // 3. REACTIVE MANHATTAN FETCHING
    // Watch 'manhattanInnings' state and fetch missing data automatically
    // This replaces manual fetching in the click handler
    useEffect(() => {
        const fetchMissingManhattanData = async () => {
            if (!match?.game_id || manhattanInnings.length === 0) return;

            const missingIds = manhattanInnings.filter(id => !manhattanData.find(d => d.id === id));

            if (missingIds.length > 0) {
                setIsManhattanLoading(true);
                const promises = missingIds.map(async (idx) => {
                    const data = await fetchOverByOver(match.game_id, idx);
                    if (data) {
                        const meta = getInningsMeta(idx - 1);
                        return { data, label: meta.label, color: meta.color, id: idx };
                    }
                    return null;
                });

                const results = await Promise.all(promises);
                const validResults = results.filter(r => r !== null) as any[];

                setManhattanData(prev => {
                    // Add new data, remove duplicates if any, sort by ID
                    const combined = [...prev, ...validResults];
                    // De-dupe by ID
                    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                    return unique.sort((a, b) => a.id - b.id);
                });
                setIsManhattanLoading(false);
            }
        };

        fetchMissingManhattanData();
    }, [manhattanInnings, match?.game_id]); // Trigger whenever selection changes


    // Simplified Handler for Manhattan Toggle
    const handleManhattanInningsChange = (inningsIdx: number) => { // 1-based index
        setManhattanInnings(prev => {
            if (prev.includes(inningsIdx)) {
                const newVal = prev.filter(i => i !== inningsIdx);
                // Don't allow empty selection, revert if empty
                return newVal.length === 0 ? prev : newVal;
            } else {
                return [...prev, inningsIdx].sort((a, b) => a - b);
            }
        });
    };





    // Independent handler for Wagon Wheel innings change
    const handleWagonWheelInningsChange = (innings: number) => {
        setWagonWheelInnings(innings);
        setIsWagonWheelLoading(true);
        fetchBatsmanSplits(match.game_id, innings).then(data => {
            if (data) setBatsmanSplits(data);
            setIsWagonWheelLoading(false);
        });
    };

    // Independent handler for Matchups innings change
    const handleMatchupsInningsChange = (innings: number) => {
        setMatchupsInnings(innings);
        setIsMatchupsLoading(true);
        Promise.all([
            fetchBatsmanSplits(match.game_id, innings),
            fetchOverByOver(match.game_id, innings)
        ]).then(([splits, obo]) => {
            if (splits) setBatsmanSplitsMatchups(splits);
            if (obo) setOverByOverMatchups(obo);
            setIsMatchupsLoading(false);
        });
    };

    const handlePartnershipsInningsChange = (innings: number) => {
        setPartnershipsInnings(innings);
    };

    // Handle clicking a recent H2H match
    const handleRecentMatchClick = async (gameId: string) => {
        setIsLoadingRecentMatch(true);
        try {
            // 1. Find the match in H2H list to build the hero object
            const recentMatches = h2hData?.team?.against_last_n_matches?.result || [];
            const rMatch = recentMatches.find((m: any) => m.file_name === gameId);

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
                setSelectedRecentScorecard(scData);
            }
        } catch (e) {
            console.error("Error loading recent match details", e);
        } finally {
            setIsLoadingRecentMatch(false);
        }
    };


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

        if (currentInn.Bowlers) {
            for (const b of currentInn.Bowlers) {
                if (b.Isbowlingnow || b.Isbowlingnow === 'true' || b.Isbowlingnow === true) {
                    if (b.ThisOver && Array.isArray(b.ThisOver)) {
                        return b.ThisOver.map((ball: any) => {
                            if (typeof ball === 'string') return ball;
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

    // Helper: Get active batsmen from scorecard
    const getCurrentBatsmenFromScorecard = () => {
        if (!scorecard?.Innings?.length) return null;
        const currentInn = scorecard.Innings[scorecard.Innings.length - 1];
        if (!currentInn.Batsmen) return null;

        // Find undefeated batsmen
        const activeBatsmen = currentInn.Batsmen.filter((b: any) => !b.Dismissal || b.Dismissal === '');

        // Map to easier format
        // We need player names from Teams object
        const battingTeamId = currentInn.Battingteam;
        const players = scorecard.Teams?.[battingTeamId]?.Players || {};

        // Find Striker ID from Partnership_Current (Reliable Source)
        let strikerId: string | null = null;
        if (currentInn.Partnership_Current?.Batsmen) {
            const pBatsmen = currentInn.Partnership_Current.Batsmen;
            const s = pBatsmen.find((pb: any) => pb.IsStriker === true || String(pb.IsStriker).toLowerCase() === 'true');
            if (s) strikerId = s.Batsman;
        }

        return activeBatsmen.map((b: any) => {
            const p = players[b.Batsman];
            // Check direct Striker flag (if present) OR match with Partnership_Current striker ID
            const isStrikerDirect = String(b.Striker).toLowerCase() === 'true' || b.Striker === true || b.Striker === '1';
            const isStrikerViaPartnership = strikerId ? (b.Batsman === strikerId) : false;

            return {
                name: p?.Name_Full || p?.Name_Short || b.Batsman,
                id: b.Batsman, // Store ID for matching
                runs: b.Runs,
                balls: b.Balls,
                fours: b.Fours,
                sixes: b.Sixes,
                strikeRate: b.Strikerate,
                isStriker: isStrikerDirect || isStrikerViaPartnership
            };
        });
    };

    // Helper: Get active bowler from scorecard
    const getCurrentBowlerFromScorecard = () => {
        if (!scorecard?.Innings?.length) return null;
        const currentInn = scorecard.Innings[scorecard.Innings.length - 1];
        if (!currentInn.Bowlers) return null;

        const bowler = currentInn.Bowlers.find((b: any) => b.Isbowlingnow || b.Isbowlingnow === 'true' || b.Isbowlingnow === true);
        if (!bowler) return null;

        const bowlingTeamId = currentInn.Bowlingteam; // Usually available, or infer from match participants
        // Actually bowler ID is in bowler.Bowler
        // Find name from other team
        // We need to find which team is bowling. It's the one NOT batting.
        const team1Id = match.participants?.[0]?.id;
        const team2Id = match.participants?.[1]?.id;
        const bowlingTeamIdCalc = currentInn.Battingteam === team1Id ? team2Id : team1Id;
        const players = scorecard.Teams?.[bowlingTeamIdCalc]?.Players || {};

        const p = players[bowler.Bowler];
        return {
            name: p?.Name_Full || p?.Name_Short || bowler.Bowler,
            wickets: bowler.Wickets,
            runs: bowler.Runs,
            overs: bowler.Overs,
            maidens: bowler.Maidens
        };
    };

    // Helper: Match chip display - "TEST 4 of 5" for series, "Match 13" for tournaments
    const getMatchChip = (): string => {
        const format = match.event_format?.toUpperCase() || '';

        if (!match.event_name) return format;

        // Pattern 1: Ordinal format like "4th Test", "1st ODI"
        const ordinalMatch = match.event_name.match(/(\d+)(st|nd|rd|th)/i);

        // Pattern 2: Tournament format like "Match 13", "Match 45"
        const tournamentMatch = match.event_name.match(/Match\s*(\d+)/i);

        if (ordinalMatch) {
            const matchNum = parseInt(ordinalMatch[1]);

            // Use Series_match_count for series (consistent "of" style)
            if (scorecard?.Matchdetail?.Series?.Series_match_count) {
                return `${format} ${matchNum} of ${scorecard.Matchdetail.Series.Series_match_count}`;
            }

            // Fallback: Extract total from series_name
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

        // Only show the LATEST inning score for the header/ticker (cleaner for Tests)
        const lastInn = teamInnings[teamInnings.length - 1];
        const score = `${lastInn.Total}/${lastInn.Wickets}`;
        const overs = lastInn.Overs ? ` (${lastInn.Overs})` : '';
        return `${score}${overs}`;
    };

    // Use scorecard scores exclusively for live
    const team1Score = getLiveScore(team1?.id);
    const team2Score = getLiveScore(team2?.id);

    React.useEffect(() => {
        if (!team1Score && !team2Score) return;

        // Get latest ball display for extras
        const scLimit = getScorecardThisOver ? getScorecardThisOver() : [];
        const thisOverBalls = scLimit.length > 0 ? scLimit : (latestBall?.thisOver || []);
        const lastBallDisplay = thisOverBalls.length > 0 ? getBallDisplay(thisOverBalls[thisOverBalls.length - 1]) : null;

        const checkScore = (curr: string, prev: string, setTicker: any) => {
            if (!curr || curr === prev) return;
            // Prevent animation on initial load (when prev is empty)
            if (!prev) return;

            const c = parseScoreSimple(curr);
            const p = parseScoreSimple(prev);

            let text = '0';
            let type: 'runs' | 'wicket' | 'dot' = 'dot';

            if (c.wickets > p.wickets) {
                text = 'W';
                type = 'wicket';
            } else if (c.runs > p.runs) {
                const diff = c.runs - p.runs;
                // Check if it's an extra (NB, WD, LB, B)
                if (lastBallDisplay && (lastBallDisplay.includes('NB') || lastBallDisplay.includes('WD') || lastBallDisplay.includes('LB') || lastBallDisplay.includes('B'))) {
                    text = `+${lastBallDisplay}`;
                } else {
                    text = `+${diff}`;
                }
                type = 'runs';
            }

            setTicker({ text, type, key: Date.now() });

            // Trigger hero flash ONLY for W, 6, 4, WD, NB
            const shouldFlash = type === 'wicket' ||
                text.includes('6') || text.includes('4') ||
                text.includes('WD') || text.includes('NB');

            if (shouldFlash) {
                const flashColor = type === 'wicket' ? '#ef4444' :
                    text.includes('6') ? '#f97316' :
                        text.includes('4') ? '#22c55e' :
                            (text.includes('WD') || text.includes('NB')) ? '#eab308' : '#60a5fa';
                setHeroFlash({ color: flashColor, key: Date.now() });
                setTimeout(() => setHeroFlash(null), 800);
            }

            // Auto-clear ticker after 5 seconds
            setTimeout(() => setTicker(null), 5000);
        };

        checkScore(team1Score || '', prevScores.current.t1, setScoreTicker1);
        checkScore(team2Score || '', prevScores.current.t2, setScoreTicker2);

        prevScores.current = { t1: team1Score || '', t2: team2Score || '' };
    }, [team1Score, team2Score]);

    // Trigger This Over animation on new ball
    React.useEffect(() => {
        const scLimit = getScorecardThisOver ? getScorecardThisOver() : [];
        const thisOverBalls = scLimit.length > 0 ? scLimit : (latestBall?.thisOver || []);
        const currentCount = thisOverBalls.length;

        // First load: just set the count, don't animate
        if (prevBallCount.current === -1) {
            prevBallCount.current = currentCount;
            return;
        }

        // New ball added (normal case: 0→1, 1→2, etc.)
        // OR new over started (reset case: 6→1, 5→1, etc. where count decreased but there's a ball)
        const isNewBall = currentCount > prevBallCount.current;
        const isNewOver = currentCount > 0 && currentCount < prevBallCount.current;

        if (isNewBall || isNewOver) {
            const newIdx = currentCount - 1;
            setNewBallIndex(newIdx);

            // Clear after animation completes (1s for slower animation)
            setTimeout(() => setNewBallIndex(null), 1100);
        }

        prevBallCount.current = currentCount;
    });

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

    // Ball dot color (handles both object and string input)
    const getBallColor = (ball: any): string => {
        // If it's an object (from wallstream/scorecard)
        if (typeof ball === 'object' && ball !== null) {
            // Wallstream object check
            if (ball.isWicket) return '#ef4444';
            if (ball.isSix) return '#f97316';
            if (ball.isFour) return '#22c55e';
            if (ball.detail?.toLowerCase() === 'nb') return '#f97316';
            if (ball.detail?.toLowerCase() === 'wd') return '#eab308';
            if (ball.detail?.toLowerCase() === 'lb' || ball.detail?.toLowerCase() === 'b') return '#60a5fa';
            // Scorecard ThisOver object { T: '4', B: '1' }
            const t = (ball.T || '').toString().toUpperCase();
            const b = (ball.B || '').toString().toUpperCase();
            if (t === 'W') return '#ef4444';
            if (t.includes('6') || b === '6') return '#f97316';
            if (t.includes('4') || b === '4') return '#22c55e';
            if (t.includes('WD') || t.includes('NB')) return '#eab308';
            if (t.includes('LB') || t.includes('B')) return '#60a5fa';
            if (b === '0' || (!t && !b)) return '#64748b'; // Dot - solid grey
            return '#60a5fa';
        }
        // String input
        const s = String(ball).toUpperCase();
        if (s === 'W') return '#ef4444';
        if (s.includes('WD') || s.includes('NB')) return '#eab308';
        if (s.includes('6')) return '#f97316';
        if (s.includes('4')) return '#22c55e';
        if (s.includes('LB') || s.includes('B')) return '#60a5fa';
        if (s === '0') return '#64748b'; // Dot - solid grey
        return '#60a5fa';
    };

    // Format ball display (handles both object and string input)
    const getBallDisplay = (ball: any): string => {
        // If it's an object
        if (typeof ball === 'object' && ball !== null) {
            // Wallstream object
            if (ball.isWicket) return 'W';
            if (ball.isSix) return '6';
            if (ball.isFour) return '4';
            if (ball.detail?.toLowerCase() === 'nb') return 'NB';
            if (ball.detail?.toLowerCase() === 'wd') return 'WD';
            if (ball.detail?.toLowerCase() === 'lb') return 'LB';
            if (ball.detail?.toLowerCase() === 'b') return 'B';
            if (ball.runs !== undefined) return String(ball.runs);
            // Scorecard ThisOver object { T: '4', B: '1' }
            const t = (ball.T || '').toString().toUpperCase();
            const b = (ball.B || '').toString().toUpperCase();
            if (t === 'W') return 'W';
            if (t) return t;
            return b || '0';
        }
        // String input
        const s = String(ball).toUpperCase();
        if (s === 'W' || s === '0W') return 'W';
        if (s.includes('B') || s.includes('LB') || s.includes('WD') || s.includes('NB')) {
            const match = s.match(/(\d+)?(B|LB|WD|NB)/);
            if (match) return match[1] ? `${match[1]}${match[2]}` : match[2];
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

    // Sticky Header Effect
    useEffect(() => {
        if (!isVisible) {
            setHeaderData(null);
            return;
        }

        if (!showStickyHeader) {
            setHeaderData(null);
            return;
        }

        const showTeam1 = isTeam1Batting || (!isTeam2Batting && team1);
        const team = showTeam1 ? team1 : team2;
        const score = showTeam1 ? team1Score : team2Score;
        const cleanName = (team?.short_name || 'Match')
            .replace(/-W/g, '')
            .replace(/Women/g, '')
            .replace(/U19/g, '')
            .replace(/-U19/g, '')
            .trim();

        // Determine elegant tint color via centralized utility
        let color = undefined;
        const brandColor = getTeamColor(cleanName);

        if (brandColor && brandColor.startsWith('#')) {
            const r = parseInt(brandColor.slice(1, 3), 16);
            const g = parseInt(brandColor.slice(3, 5), 16);
            const b = parseInt(brandColor.slice(5, 7), 16);
            color = `rgba(${r}, ${g}, ${b}, 0.35)`;
        }

        const scoreStr = score || '0/0';

        const scLimit = getScorecardThisOver ? getScorecardThisOver() : [];
        const thisOverBalls = scLimit.length > 0 ? scLimit : (latestBall?.thisOver || []);
        const lastBall = thisOverBalls.length > 0 ? thisOverBalls[thisOverBalls.length - 1] : null;

        const ballData = lastBall ? {
            // Fix: Use deterministic ID instead of Date.now() to prevent redundant animations
            id: (lastBall && typeof lastBall === 'object' && (lastBall.comm_id || lastBall.event_id))
                ? (lastBall.comm_id || lastBall.event_id)
                : `ball_${cleanName.replace(/\s/g, '')}_${scoreStr}_${thisOverBalls.length}`,
            text: getBallDisplay(lastBall),
            color: getBallColor(lastBall)
        } : undefined;

        setHeaderData({
            mainText: `${cleanName} ${scoreStr}`,
            teamColor: color,
            ball: ballData
        });

        return () => {
            setHeaderData(null);
        };
    }, [showStickyHeader, team1Score, team2Score, isTeam1Batting, isTeam2Batting, team1, team2, latestBall, isVisible]);

    return (
        <div className="upcoming-detail" onScroll={handleScroll}>
            {/* Hero Card - Same structure as UpcomingDetail */}
            <div className="upcoming-hero" style={{ ...heroStyle, position: 'relative', overflow: 'hidden' }}>
                {/* Hero Flash Overlay */}
                {heroFlash && (
                    <div key={heroFlash.key} style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: heroFlash.color,
                        opacity: 0.4,
                        animation: 'heroFlashFade 0.8s ease-out forwards',
                        pointerEvents: 'none',
                        zIndex: 0
                    }} />
                )}
                <style>{`
                    @keyframes heroFlashFade {
                        0% { opacity: 0.5; }
                        100% { opacity: 0; }
                    }
                `}</style>
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
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                    }}>
                        {match.series_name}
                    </span>
                    {onSeriesClick && <span style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.4)', flexShrink: 0 }}>›</span>}
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
                            {getMatchChip()}
                        </span>
                    )}


                </div>

                <div className="upcoming-teams">
                    {/* Team 1 */}
                    <div className="upcoming-team" style={{ position: 'relative' }}>
                        {scoreTicker1 && (
                            <div key={scoreTicker1.key} style={{
                                position: 'absolute', top: -8, right: -15,
                                background: getBallColor(scoreTicker1.text.replace('+', '')),
                                color: '#fff', fontSize: 13, fontWeight: 800, padding: '4px 12px', borderRadius: 16,
                                boxShadow: `0 4px 16px ${getBallColor(scoreTicker1.text.replace('+', ''))}80`,
                                animation: 'heroTickerPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                                transformOrigin: 'center bottom'
                            }}>
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
                            <div key={scoreTicker2.key} style={{
                                position: 'absolute', top: -8, left: -15,
                                background: getBallColor(scoreTicker2.text.replace('+', '')),
                                color: '#fff', fontSize: 13, fontWeight: 800, padding: '4px 12px', borderRadius: 16,
                                boxShadow: `0 4px 16px ${getBallColor(scoreTicker2.text.replace('+', ''))}80`,
                                animation: 'heroTickerPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                                transformOrigin: 'center bottom'
                            }}>
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
                {/* Venue - Bottom Style */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    {match.venue || match.venue_name || 'Venue TBD'}
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

            {/* View Switcher (Segmented Control) */}
            <div style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 100, // Fully rounded for sleek pill look
                padding: 3,
                marginBottom: 20,
                border: '1px solid rgba(255,255,255,0.05)',
                maxWidth: 240, // Limit width to keep it sleek
                margin: '0 auto 20px auto' // Center it
            }}>
                {['live', 'insights'].map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                padding: '6px 0',
                                borderRadius: 100,
                                border: 'none',
                                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                                fontSize: 11,
                                fontWeight: isActive ? 700 : 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5
                            }}
                        >
                            {tab === 'live' ? 'Live' : 'Insights'}
                        </button>
                    )
                })}
            </div>


            {/* === INSIGHTS VIEW === */}
            {activeTab === 'insights' && (
                <LiveInsights
                    match={match}
                    h2hData={h2hData}
                    scorecard={scorecard}
                    batsmanSplits={batsmanSplits}
                    overByOver={overByOver}
                    wormPrimary={wormPrimary}
                    wormSecondary={wormSecondary}
                    wagonWheelInnings={wagonWheelInnings}
                    onWagonWheelInningsChange={handleWagonWheelInningsChange}
                    isWagonWheelLoading={isWagonWheelLoading}
                    // Matchups Props
                    batsmanSplitsMatchups={batsmanSplitsMatchups}
                    overByOverMatchups={overByOverMatchups}
                    matchupsInnings={matchupsInnings}
                    onMatchupsInningsChange={handleMatchupsInningsChange}
                    isMatchupsLoading={isMatchupsLoading}
                    // Partnerships Props
                    partnershipsInnings={partnershipsInnings}
                    onPartnershipsInningsChange={handlePartnershipsInningsChange}
                    // Manhattan Props
                    manhattanData={manhattanData}
                    manhattanInnings={manhattanInnings}
                    onManhattanInningsChange={handleManhattanInningsChange}
                    isManhattanLoading={isManhattanLoading}
                    // Initial loading state - show skeleton when no data yet
                    isLoading={!scorecard && !h2hData && !batsmanSplits}
                    isWormLoading={isWormLoading}
                    onH2HMatchClick={handleRecentMatchClick}
                    winProb={winProb}
                />
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

                {/* Win Probability Algorithm - Always render structure */}
                <div style={{ marginBottom: 16 }}>
                    <WinProbabilityBar
                        data={winProb}
                        isLoading={!winProb}
                    />
                </div>

                {/* Live Situation Panel */}
                {(latestBall || scorecard?.Innings?.length > 0) && (() => {
                    const activeBatsmen = getCurrentBatsmenFromScorecard();
                    const activeBowler = getCurrentBowlerFromScorecard();

                    // Fallback to latestBall if scorecard helpers return nothing (though unlikely with strict scorecard)
                    // But user wants strict scorecard? Let's try scorecard first.

                    // Determine Striker / Non-Striker
                    let striker;
                    let nonStriker;

                    // Priority 1: Use Scorecard 'Striker' flag (checked via Partnership_Current in getCurrentBatsmenFromScorecard)
                    if (activeBatsmen) {
                        striker = activeBatsmen.find((b: any) => b.isStriker);
                    }

                    // Priority 2: Fallback logic
                    // If no striker flag found, default to 0 and 1
                    if (!striker && activeBatsmen && activeBatsmen.length > 0) {
                        striker = activeBatsmen[0];
                    }

                    // Determine Non-Striker (anyone who is not the striker)
                    if (striker && activeBatsmen && activeBatsmen.length > 1) {
                        nonStriker = activeBatsmen.find((b: any) => b !== striker);
                    } else if (!striker && activeBatsmen && activeBatsmen.length > 1) {
                        // Fallback if striker is still null (e.g. empty array?)
                        nonStriker = activeBatsmen[1];
                    }

                    // Strict Scorecard usage as requested
                    const sName = striker?.name;
                    const sRuns = striker?.runs;
                    const sBalls = striker?.balls;

                    const nsName = nonStriker?.name;
                    const nsRuns = nonStriker?.runs;
                    const nsBalls = nonStriker?.balls;

                    return (
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
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#22c55e', textTransform: 'uppercase', marginBottom: 2 }}>{sName}</div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                        {sRuns || '0'}<span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>({sBalls || '0'})</span>
                                    </div>
                                    {/* Boundary Stats Below Score */}
                                    {(() => {
                                        const stats = getBoundaryStats(sName);
                                        if (stats) return (
                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>
                                                {stats.fours}x4 &nbsp; {stats.sixes}x6
                                            </div>
                                        );
                                        return null;
                                    })()}
                                </div>

                                <div style={{ textAlign: 'center', minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    {/* Partnership Display (Replacing Last Ball) */}
                                    <div style={{
                                        marginBottom: 6,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {(() => {
                                            const currentPartnership = scorecard?.Innings?.[scorecard.Innings.length - 1]?.Partnership_Current;
                                            if (currentPartnership) {
                                                return (
                                                    <>
                                                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                                                            {currentPartnership.Runs}
                                                            <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>
                                                                ({currentPartnership.Balls})
                                                            </span>
                                                        </div>
                                                    </>
                                                );
                                            }
                                            // Fallback if no partnership data
                                            return <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>-</div>;
                                        })()}
                                    </div>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Partnership</div>

                                    {/* Bowler Details - Centered below Last Ball */}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6, marginTop: 4, width: '100%' }}>
                                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 2 }}>Bowler</div>
                                        <div style={{ fontSize: 11, color: '#fff', fontWeight: 700, marginBottom: 2, letterSpacing: 0.5 }}>{activeBowler?.name || latestBall?.bowlerName || '-'}</div>
                                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                                            {activeBowler ? `${activeBowler.wickets}-${activeBowler.runs}` :
                                                latestBall?.bowlerWickets !== undefined ? `${latestBall.bowlerWickets}-${latestBall.bowlerRuns}` : '-'}
                                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
                                                ({activeBowler ? activeBowler.overs : latestBall?.bowlerOvers || '-'})
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ flex: 1, textAlign: 'right' }}>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>Non-Striker</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', textTransform: 'uppercase', marginBottom: 2 }}>{nsName}</div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                        {nsRuns || '0'}<span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>({nsBalls || '0'})</span>
                                    </div>
                                    {/* Boundary Stats Below Score */}
                                    {(() => {
                                        const stats = getBoundaryStats(nsName);
                                        if (stats) return (
                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>
                                                {stats.fours}x4 &nbsp; {stats.sixes}x6
                                            </div>
                                        );
                                        return null;
                                    })()}
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

                            {((scorecard?.Innings?.[(scorecard.Innings?.length || 1) - 1]?.LastOvers?.['5']) || ((latestBall?.thisOver?.length ?? 0) > 0) || (getScorecardThisOver().length > 0)) && (
                                <div style={{ display: 'flex', height: 50, marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>

                                    {/* Last 5 Overs - Compact & Bottom Aligned */}
                                    <div style={{
                                        width: 60,
                                        height: '100%',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                                        paddingBottom: 8
                                    }}>
                                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 'auto', paddingTop: 4, letterSpacing: 0.5 }}>Last 5 Ov</div>
                                        {scorecard?.Innings?.[(scorecard.Innings?.length ?? 1) - 1]?.LastOvers?.['5'] ? (
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'monospace', lineHeight: 1 }}>
                                                {scorecard?.Innings?.[(scorecard.Innings?.length ?? 1) - 1]?.LastOvers?.['5']?.Score}/{scorecard?.Innings?.[(scorecard.Innings?.length ?? 1) - 1]?.LastOvers?.['5']?.Wicket}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>-</div>
                                        )}
                                    </div>

                                    {/* Separator - Short & Bottom Aligned */}
                                    <div style={{
                                        width: 1, height: 16,
                                        background: 'rgba(255,255,255,0.1)',
                                        alignSelf: 'flex-end', marginBottom: 10
                                    }} />

                                    {/* This Over balls - Expands & Bottom Aligned */}
                                    <div style={{
                                        flex: 1,
                                        height: '100%',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                                        paddingBottom: 6,
                                        paddingLeft: 4, paddingRight: 4,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderRadius: 8
                                    }}>
                                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 'auto', paddingTop: 4, letterSpacing: 0.5, zIndex: 1 }}>This Over</div>
                                        <style>
                                            {`
                                                @keyframes popReveal {
                                                    0% { transform: scale(0); opacity: 0; }
                                                    60% { transform: scale(1.3); opacity: 1; }
                                                    100% { transform: scale(1); opacity: 1; }
                                                }
                                                @keyframes bgExpand {
                                                    0% { transform: scale(0); opacity: 1; }
                                                    40% { transform: scale(15); opacity: 1; }
                                                    70% { transform: scale(1); opacity: 1; }
                                                    100% { transform: scale(1); opacity: 1; }
                                                }
                                                @keyframes heroTickerPop {
                                                    0% { transform: scale(0) translateY(-20px); opacity: 0; }
                                                    40% { transform: scale(1.5) translateY(3px); opacity: 1; }
                                                    70% { transform: scale(0.95) translateY(-1px); }
                                                    100% { transform: scale(1) translateY(0); opacity: 1; }
                                                }
                                            `}
                                        </style>

                                        <div className="hide-scrollbar" style={{
                                            display: 'flex', gap: 6, alignItems: 'center',
                                            flexWrap: 'nowrap',
                                            overflowX: 'auto',
                                            width: '100%',
                                            scrollbarWidth: 'none',
                                            msOverflowStyle: 'none'
                                        }}>
                                            {(() => {
                                                const scLimit = getScorecardThisOver();
                                                const thisOverBalls = scLimit.length > 0 ? scLimit : (latestBall?.thisOver || []);
                                                // Dynamic justification inside the IIFE or via parent style?
                                                // We can use margin: auto on the content wrapper if we want centering + scroll

                                                return (
                                                    <div style={{
                                                        display: 'flex', gap: 6,
                                                        margin: thisOverBalls.length > 7 ? '0' : '0 auto', // Center if few balls, left align if many
                                                        flexShrink: 0
                                                    }}>
                                                        {thisOverBalls.map((ball: any, idx: number) => {
                                                            const isNewBall = idx === newBallIndex;
                                                            return (
                                                                <div key={idx} style={{
                                                                    width: 24, height: 24, borderRadius: '50%',
                                                                    position: 'relative',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    flexShrink: 0,
                                                                }}>
                                                                    {/* Background layer - only animate for new ball */}
                                                                    {isNewBall && (
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            width: 24, height: 24, borderRadius: '50%',
                                                                            background: getBallColor(ball),
                                                                            animation: 'bgExpand 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                                                                            transformOrigin: 'center center',
                                                                            zIndex: 100
                                                                        }} />
                                                                    )}
                                                                    {/* Number layer */}
                                                                    <div style={{
                                                                        position: 'relative',
                                                                        width: 24, height: 24, borderRadius: '50%',
                                                                        background: getBallColor(ball),
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: 9, fontWeight: 700, color: '#fff',
                                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                                        animation: isNewBall ? 'popReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards' : 'none',
                                                                        zIndex: isNewBall ? 101 : 1
                                                                    }}>
                                                                        {getBallDisplay(ball)}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {/* Placeholders */}
                                                        {Array(Math.max(0, 6 - thisOverBalls.length)).fill(null).map((_, idx) => (
                                                            <div key={`e-${idx}`} style={{
                                                                width: 6, height: 6, borderRadius: '50%',
                                                                background: 'rgba(255,255,255,0.08)',
                                                                margin: '9px 9px',
                                                                flexShrink: 0
                                                            }} />
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

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

                                // Note: Bowler change detection moved to inference logic below (isBowlerChangeCard)

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
                                    resultText = ball.runs !== '0' ? `${ball.runs} + No Ball` : 'No Ball';
                                    resultColor = '#f97316';
                                } else if (ball.detail?.toLowerCase() === 'wd') {
                                    markerColor = '#eab308'; // Yellow for wide
                                    resultText = ball.runs !== '0' && ball.runs !== '1' ? `${ball.runs} Wides` : 'Wide';
                                    resultColor = '#eab308';
                                } else if (ball.detail?.toLowerCase() === 'lb') {
                                    resultText = ball.runs !== '0' ? `${ball.runs} Leg Bye${ball.runs !== '1' ? 's' : ''}` : 'Leg Bye';
                                    resultColor = '#60a5fa';
                                } else if (ball.detail?.toLowerCase() === 'b') {
                                    resultText = ball.runs !== '0' ? `${ball.runs} Bye${ball.runs !== '1' ? 's' : ''}` : 'Bye';
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

                                // Note: We removed the old explicit event block since U19 balls are always 'isball: true'.
                                // Event inference is now handled inside the main ball loop below.


                                // Helper to check if commentary body should be shown
                                // Event Card (Non-ball commentary like 'Innings Break', 'Stumps', etc.) - REMOVED as U19 API balls are always 'isball: true'.

                                // --- INFERENCE LOGIC ---
                                // Note: 'wallstream.balls' is descending (latest first). 'prevBall' is at idx + 1.

                                // Find the previous ACTUAL BALL (skip non-ball events like drinks, timeouts)
                                const findPreviousBall = () => {
                                    for (let i = idx + 1; i < wallstream.balls.length; i++) {
                                        if (wallstream.balls[i].isball) return wallstream.balls[i];
                                    }
                                    return null;
                                };
                                const prevBall = findPreviousBall();

                                // New Bowler: Change in ID or Name (fallback if ID missing)
                                const isBowlerChangeCard = prevBall && (
                                    (ball.bowlerId && prevBall.bowlerId)
                                        ? ball.bowlerId !== prevBall.bowlerId
                                        : ball.bowlerName !== prevBall.bowlerName
                                );

                                // New Batter: If PREVIOUS ball was a wicket, we assume THIS ball starts with a new batter.
                                const isNewBatterCard = prevBall && prevBall.isWicket;

                                // Extract Entity Name for New Batter
                                let newBatterName = '';
                                if (isNewBatterCard) {
                                    // Compare IDs to see who is new
                                    const prevIds = [(prevBall as any).batsmanId, (prevBall as any).nonStrikerId];
                                    const currIds = [(ball as any).batsmanId, (ball as any).nonStrikerId];
                                    const newId = currIds.find(id => !prevIds.includes(id));
                                    if (newId) {
                                        if (newId === (ball as any).batsmanId) newBatterName = ball.batsmanName;
                                        else newBatterName = ball.nonStrikerName;
                                    }
                                    // Fallback
                                    if (!newBatterName) newBatterName = ball.batsmanName;
                                }

                                // Helper to check if commentary body should be shown
                                const isRedundantBody = ball.commentary && /^(no run|dot ball|\d+\s*runs?|wide|bye|leg\s*bye|four|six|wicket)[!.]*$/i.test(ball.commentary.trim());
                                const showBody = ball.commentary && !isRedundantBody;

                                // Skip rendering explicit non-ball API events (change_of_bowler, change_of_ball, etc.)
                                // These have no bowler/batsman data and would render empty cards or trigger false bowling changes
                                // Our inferred bowling change card will handle them with proper bowler stats
                                if (!ball.isball) {
                                    return null;
                                }

                                return (
                                    <React.Fragment key={idx}>

                                        {/* 3. The Ball Card Itself (Rendered First in this block, appearing on Top) */}
                                        <div style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: 16, alignItems: showBody ? 'flex-start' : 'center' }}>
                                            {/* Timeline Line - centered on ball */}
                                            <div style={{
                                                position: 'absolute', left: 13, top: 0, bottom: 0, width: 2, background: 'rgba(255, 255, 255, 0.08)',
                                                display: idx === wallstream.balls.length - 1 ? 'none' : 'block'
                                            }} />

                                            {/* Ball/Event Dot - 28px, full over.ball */}
                                            <div style={{
                                                zIndex: 1, width: 28, height: 28, borderRadius: '50%',
                                                background: markerColor,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 10, fontWeight: 700, color: '#fff',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}>
                                                {markerText}
                                            </div>

                                            {/* Content Block */}
                                            <div style={{ flex: 1, paddingTop: 0 }}>
                                                {/* Header: Bowler to Batsman */}
                                                <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                                                    <div style={{ fontSize: 14, color: '#fff' }}>
                                                        <span style={{ fontWeight: 600 }}>{ball.bowlerName}</span> to <span style={{ fontWeight: 600 }}>{ball.batsmanName}</span>
                                                    </div>
                                                </div>

                                                {/* Ball Detail (Runs/Wicket text) */}
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 800, color: resultColor, textTransform: 'uppercase', background: `${resultColor}15`, padding: '2px 8px', borderRadius: 6 }}>
                                                        {resultText}
                                                    </div>
                                                    {/* Only show detail chip for non-standard events (not w, wd, nb, lb, b which are handled above) */}
                                                    {ball.detail && !['w', 'wd', 'nb', 'lb', 'b', ''].includes(ball.detail.toLowerCase()) && formatDetail(ball.detail) && (
                                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#a1a1aa', background: '#27272a', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                                                            {formatDetail(ball.detail)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Body: Commentary */}
                                                {showBody && (
                                                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: '1.5', fontFamily: 'Inter, sans-serif' }}>
                                                        {ball.commentary}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 1. Event Cards (Moved Below Ball to reverse-chronologically sit between Ball and Prev Over Separator) */}

                                        {isBowlerChangeCard && (() => {
                                            const newBowlerName = ball.bowlerName;
                                            const targetBall = ball;
                                            const oversFloat = targetBall.bowlerOvers ? parseFloat(targetBall.bowlerOvers) : 0;
                                            const hasBowled = oversFloat > 0.1;

                                            const bowlerId = ball.bowlerId || findPlayerIdByName(newBowlerName);
                                            const h2hPlayer = !hasBowled ? findPlayerInH2H(newBowlerName, 'bowler', bowlerId) : null;
                                            const recentForm = h2hPlayer ? getRecentForm(h2hPlayer, 'bowler') : null;

                                            return (
                                                <div style={{
                                                    display: 'flex', gap: 12, marginBottom: 12, padding: 10, position: 'relative',
                                                    background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 10, alignItems: 'center', marginLeft: 40
                                                }}>
                                                    {/* Timeline Line through event card - extends beyond to connect */}
                                                    <div style={{
                                                        position: 'absolute', left: -28, top: 0, bottom: 0, width: 2, background: 'rgba(255, 255, 255, 0.08)'
                                                    }} />
                                                    <WikiImage name={newBowlerName} id={bowlerId} type="player" circle={true} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 10, color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Bowling Change</div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{newBowlerName}</div>
                                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                                                            {hasBowled
                                                                ? `${targetBall.bowlerOvers}ov • ${targetBall.bowlerWickets}/${targetBall.bowlerRuns} • ${targetBall.bowlerMaidens}m`
                                                                : 'First Spell'}
                                                        </div>
                                                        {recentForm && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{recentForm.label}: {recentForm.value}</div>}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {isNewBatterCard && newBatterName && (() => {
                                            let playerId: string | undefined = undefined;
                                            if (newBatterName === ball.batsmanName) playerId = ball.batsmanId;
                                            else if (newBatterName === ball.nonStrikerName) playerId = ball.nonStrikerId;

                                            if (!playerId) playerId = findPlayerIdByName(newBatterName);

                                            const h2hPlayer = findPlayerInH2H(newBatterName, 'batsmen', playerId);
                                            const recentForm = h2hPlayer ? getRecentForm(h2hPlayer, 'batsmen') : null;

                                            return (
                                                <div style={{
                                                    display: 'flex', gap: 12, marginBottom: 12, padding: 10, position: 'relative',
                                                    background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 10, alignItems: 'center', marginLeft: 40
                                                }}>
                                                    {/* Timeline Line through event card - extends beyond to connect */}
                                                    <div style={{
                                                        position: 'absolute', left: -28, top: 0, bottom: 0, width: 2, background: 'rgba(255, 255, 255, 0.08)'
                                                    }} />
                                                    <WikiImage name={newBatterName} id={playerId} type="player" circle={true} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>New Batter</div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{newBatterName}</div>
                                                        {recentForm && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{recentForm.label}: {recentForm.value}</div>}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* 4. Over Separator (Moved to BOTTOM) */}
                                        {showOverSeparator && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, opacity: 0.5 }}>
                                                <div style={{ width: 28, display: 'flex', justifyContent: 'center' }}><div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} /></div>
                                                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                                                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>End of Over {nextOverNum + 1}</div>
                                                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                                            </div>
                                        )}
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
                {/* Sticky Scroll Header - Glassmorphic Card */}


            </div >

            {/* Drill-down Overlay for Recent Match */}
            {
                selectedRecentMatch && selectedRecentScorecard && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 2200,
                        background: 'var(--bg-app)'
                    }}>
                        <CompletedDetail
                            match={selectedRecentMatch}
                            scorecard={selectedRecentScorecard}
                            onClose={() => {
                                setSelectedRecentMatch(null);
                                setSelectedRecentScorecard(null);
                            }}
                            onSeriesClick={onSeriesClick}
                        />
                    </div>
                )
            }

            {/* Loading Overlay */}
            {
                isLoadingRecentMatch && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        zIndex: 2300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#f59e0b', borderRadius: '50%', marginBottom: 16 }}></div>
                        <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>Loading Match...</div>
                    </div>
                )
            }
        </div >
    );
};

export default LiveDetail;
