import React, { useState, useEffect } from 'react';
import WikiImage, { getFlagUrl } from './WikiImage';
import LiveInsights from './LiveInsights';
import useCricketData from '../utils/useCricketData';
import { getTeamColor } from '../utils/teamColors';
import { getMatchStatusConfig } from '../utils/matchStatus';
import { Match, Scorecard } from '../types';
import { BatsmanSplitsResponse, OverByOverResponse } from '../utils/h2hApi';

// AI Summary JSON URL (fetched from GitHub)
const AI_SUMMARY_URL = 'https://raw.githubusercontent.com/ashwkun/crickbox/main/src/data/ai_match_summaries.json';
const AUDIO_BASE_URL = 'https://raw.githubusercontent.com/ashwkun/crickbox/main/src/data/audio';

// Model Logo Components
const GrokLogo = () => (
    <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
        <path d="M18.542 30.532l15.956-11.776c.783-.576 1.902-.354 2.274.545 1.962 4.728 1.084 10.411-2.819 14.315-3.903 3.901-9.333 4.756-14.299 2.808l-5.423 2.511c7.778 5.315 17.224 4 23.125-1.903 4.682-4.679 6.131-11.058 4.775-16.812l.011.011c-1.966-8.452.482-11.829 5.501-18.735C47.759 1.332 47.88 1.166 48 1l-6.602 6.599V7.577l-22.86 22.958M15.248 33.392c-5.582-5.329-4.619-13.579.142-18.339 3.521-3.522 9.294-4.958 14.331-2.847l5.412-2.497c-.974-.704-2.224-1.46-3.659-1.994-6.478-2.666-14.238-1.34-19.505 3.922C6.904 16.701 5.31 24.488 8.045 31.133c2.044 4.965-1.307 8.48-4.682 12.023C2.164 44.411.967 45.67 0 47l15.241-13.608" fill="#fff" />
    </svg>
);

const GPTLogo = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364l2.0201-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4043-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997z" fill="#fff" />
    </svg>
);

const MetaLogo = () => (
    <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
        <path d="M5,19.5c0-4.6,2.3-9.4,5-9.4c1.5,0,2.7,0.9,4.6,3.6c-1.8,2.8-2.9,4.5-2.9,4.5c-2.4,3.8-3.2,4.6-4.5,4.6 C5.9,22.9,5,21.7,5,19.5 M20.7,17.8L19,15c-0.4-0.7-0.9-1.4-1.3-2c1.5-2.3,2.7-3.5,4.2-3.5c3,0,5.4,4.5,5.4,10.1 c0,2.1-0.7,3.3-2.1,3.3S23.3,22,20.7,17.8 M16.4,11c-2.2-2.9-4.1-4-6.3-4C5.5,7,2,13.1,2,19.5c0,4,1.9,6.5,5.1,6.5 c2.3,0,3.9-1.1,6.9-6.3c0,0,1.2-2.2,2.1-3.7c0.3,0.5,0.6,1,0.9,1.6l1.4,2.4c2.7,4.6,4.2,6.1,6.9,6.1c3.1,0,4.8-2.6,4.8-6.7 C30,12.6,26.4,7,22.1,7C19.8,7,18,8.8,16.4,11" fill="#fff" />
    </svg>
);

const PlayIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M8 5V19L19 12L8 5Z" fill="white" />
    </svg>
);

const PauseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z" fill="white" />
    </svg>
);

// AI Insight Card Component with .WRAP branding
const AIInsightCard = ({ summary, model, audioFile }: { summary: string; model?: string; audioFile?: string }) => {
    const [expanded, setExpanded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (audioFile) {
            const audioUrl = `${AUDIO_BASE_URL}/${audioFile}`;
            const newAudio = new Audio(audioUrl);
            newAudio.onended = () => setIsPlaying(false);
            setAudio(newAudio);
        }
        return () => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        };
    }, [audioFile]);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(e => console.error("Audio playback error:", e));
        }
        setIsPlaying(!isPlaying);
    };

    const cleanText = summary.replace(/\*\*/g, '').trim();
    const lines = cleanText.split('\n').filter(l => l.trim());
    const headline = lines[0] || '';
    const body = lines.slice(1).join(' ');

    const getModelInfo = () => {
        if (!model) return null;
        if (model.includes('grok')) return { name: 'Grok', Logo: GrokLogo };
        if (model.includes('gpt')) return { name: 'GPT-4o', Logo: GPTLogo };
        if (model.includes('Llama') || model.includes('meta')) return { name: 'Llama', Logo: MetaLogo };
        return null;
    };
    const modelInfo = getModelInfo();

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(16px)',
            borderRadius: 16,
            padding: '16px 18px',
            marginBottom: 20,
            border: isPlaying ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: isPlaying
                ? '0 0 30px rgba(139, 92, 246, 0.2), inset 0 0 10px rgba(139, 92, 246, 0.1)'
                : '0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative' as const,
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute' as const,
                top: -40, right: -40,
                width: 120, height: 120,
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'orbFloat 4s ease-in-out infinite',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute' as const,
                bottom: -30, left: -30,
                width: 80, height: 80,
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'orbFloat 5s ease-in-out infinite reverse',
                pointerEvents: 'none'
            }} />

            <style>{`
                @keyframes wrapShimmer { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
                @keyframes orbFloat { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; } 50% { transform: translate(-10px, 10px) scale(1.1); opacity: 0.8; } }
                @keyframes continueShimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, position: 'relative' as const, zIndex: 1 }}>
                <span style={{
                    fontFamily: '"BBH Bartle", sans-serif',
                    fontSize: 14, fontWeight: 600, letterSpacing: 1,
                    background: 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 50%, #8b5cf6 100%)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'wrapShimmer 3s ease-in-out infinite'
                }}>.WRAP</span>

                {audioFile && (
                    <button onClick={togglePlay} style={{
                        background: isPlaying ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.1)',
                        border: `1px solid ${isPlaying ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 12, padding: '6px 12px',
                        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isPlaying ? '0 0 15px rgba(139, 92, 246, 0.4)' : 'none',
                        transform: isPlaying ? 'scale(1.02)' : 'scale(1)'
                    }}>
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', opacity: 0.9, letterSpacing: 0.5 }}>
                            {isPlaying ? 'PLAYING' : 'LISTEN'}
                        </span>
                    </button>
                )}
            </div>

            {headline && (
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: body ? 10 : 0, position: 'relative' as const, zIndex: 1 }}>
                    {headline}
                </div>
            )}

            {body && (
                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255, 255, 255, 0.65)', position: 'relative' as const, zIndex: 1 }}>
                    {expanded ? body : body.slice(0, 250)}
                    {!expanded && body.length > 250 && '...'}

                    {(modelInfo || body.length > 250) && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, marginTop: 12, opacity: 0.9, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                            {modelInfo && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, opacity: 0.6 }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>by</span>
                                    <modelInfo.Logo />
                                    <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{modelInfo.name}</span>
                                </div>
                            )}
                            {body.length > 250 && (
                                <div onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <span style={{
                                        fontStyle: 'italic', fontSize: 12,
                                        background: 'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.6) 100%)',
                                        backgroundSize: '200% 100%',
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                        animation: 'continueShimmer 2s ease-in-out infinite'
                                    }}>
                                        {expanded ? 'show less ↑' : 'continue reading ↓'}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface CompletedDetailProps {
    match: Match;
    scorecard: Scorecard | null;
    onClose: () => void;
    onSeriesClick?: (seriesId: string, seriesMatches?: any[]) => void;
}

const CompletedDetail: React.FC<CompletedDetailProps> = ({ match, scorecard, onClose, onSeriesClick }) => {
    const { fetchH2H, fetchBatsmanSplits, fetchOverByOver } = useCricketData();

    // AI Summary State
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [aiModel, setAiModel] = useState<string | null>(null);
    const [aiAudio, setAiAudio] = useState<string | null>(null);

    // Scorecard Tab State
    const [selectedInningsIdx, setSelectedInningsIdx] = useState(0);

    // Insights Data State (fetched ONCE)
    const [h2hData, setH2hData] = useState<any>(null);
    const [batsmanSplits, setBatsmanSplits] = useState<BatsmanSplitsResponse | null>(null);
    const [overByOver, setOverByOver] = useState<OverByOverResponse | null>(null);
    const [wormPrimary, setWormPrimary] = useState<{ data: OverByOverResponse | null, label: string, color: string } | null>(null);
    const [wormSecondary, setWormSecondary] = useState<{ data: OverByOverResponse | null, label: string, color: string } | null>(null);
    const [manhattanData, setManhattanData] = useState<{ data: OverByOverResponse, label: string, color: string, id: number }[]>([]);
    const [manhattanInnings, setManhattanInnings] = useState<number[]>([]);
    const [isInsightsLoading, setIsInsightsLoading] = useState(true);

    // Insights Innings Control
    const [wagonWheelInnings, setWagonWheelInnings] = useState(1);
    const [matchupsInnings, setMatchupsInnings] = useState(1);
    const [partnershipsInnings, setPartnershipsInnings] = useState(1);

    const team1 = match.participants?.[0];
    const team2 = match.participants?.[1];
    const color1 = getTeamColor(team1?.name) || getTeamColor(team1?.short_name) || '#3b82f6';
    const color2 = getTeamColor(team2?.name) || getTeamColor(team2?.short_name) || '#8b5cf6';

    // Fetch AI Summary
    useEffect(() => {
        const fetchAISummary = async () => {
            try {
                const res = await fetch(`${AI_SUMMARY_URL}?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    // Try match_id first (exact numeric ID), then fall back to game_id variations
                    const matchId = match.match_id;
                    const gameId = match.game_id;
                    const numericSuffix = gameId?.match(/(\d{6})$/)?.[1];

                    const matchData = (matchId ? data[matchId] : null) ||
                        data[gameId] ||
                        data[String(gameId)] ||
                        (numericSuffix ? data[numericSuffix] : null);
                    if (matchData) {
                        setAiSummary(matchData?.text || null);
                        setAiModel(matchData?.model || null);
                        setAiAudio(matchData?.audio || null);
                    }
                }
            } catch (e) {
                console.log('AI Summary fetch failed:', e);
            }
        };
        fetchAISummary();
    }, [match.game_id]);

    // Fetch Insights Data (ONE TIME)
    useEffect(() => {
        if (!match?.game_id || !scorecard?.Innings?.length) return;

        const loadInsights = async () => {
            if (!match.game_id || !scorecard?.Innings) return;

            console.log("🚀 Starting Insights Load...");
            const startTime = performance.now();
            setIsInsightsLoading(true);

            const inningsCount = scorecard.Innings.length;
            const inningsIds = scorecard.Innings.map((_: any, i: number) => i + 1);

            // Define helper to get metadata for an innings
            const getInningsMeta = (idx: number) => {
                const inn = scorecard.Innings[idx];
                const teamId = inn?.Battingteam;
                const team = scorecard.Teams?.[teamId];
                const label = `${team?.Name_Short || 'TM'} ${Math.floor(idx / 2) + 1}`;
                const teamColor = getTeamColor(team?.Name_Full || team?.Name_Short) || '#3b82f6';
                return { label, color: teamColor };
            };

            try {
                // Parallel Fetching: Get H2H, Splits for last innings AND OBO for ALL innings at once
                console.time("Fetch_All_Insights");
                const [h2h, splits, ...oboResults] = await Promise.all([
                    fetchH2H(match.game_id),
                    fetchBatsmanSplits(match.game_id, inningsCount),
                    ...inningsIds.map((id: number) => fetchOverByOver(match.game_id, id))
                ]);
                console.timeEnd("Fetch_All_Insights");

                const fetchTime = performance.now();
                console.log(`📡 Network Requests completed in ${(fetchTime - startTime).toFixed(2)}ms`);

                // 0. Set H2H
                if (h2h) setH2hData(h2h);

                // 1. Set Splits (Matches & Wagon Wheel)
                if (splits) setBatsmanSplits(splits);

                // 2. Process OBO Data (Worm, Manhattan, Matchups)
                const validManhattanData: any[] = [];

                // Create a map for easy access
                const oboMap = new Map();
                oboResults.forEach((data, index) => {
                    if (data) {
                        const id = index + 1;
                        oboMap.set(id, data);

                        // Prepare Manhattan Data
                        const meta = getInningsMeta(index);
                        validManhattanData.push({
                            data,
                            label: meta.label,
                            color: meta.color,
                            id
                        });
                    }
                });

                setManhattanData(validManhattanData);
                setManhattanInnings(validManhattanData.map(m => m.id));

                // 3. Worm Charts (Primary vs Secondary)
                // Find Primary (Home/First Batting)
                const primaryIdx = scorecard.Innings.findIndex((inn: any) => inn.Battingteam === match.participants[0].id) !== -1
                    ? scorecard.Innings.findIndex((inn: any) => inn.Battingteam === match.participants[0].id)
                    : 0;

                const primaryId = primaryIdx + 1;
                if (oboMap.has(primaryId)) {
                    const meta = getInningsMeta(primaryIdx);
                    setWormPrimary({ data: oboMap.get(primaryId), label: meta.label, color: meta.color });
                }

                // Find Secondary (Away/Second Batting)
                const primaryTeamId = scorecard.Innings[primaryIdx]?.Battingteam;
                let secondaryIdx = -1;

                // Look for the last innings that ISN'T the primary team
                for (let i = inningsCount - 1; i >= 0; i--) {
                    if (scorecard.Innings[i].Battingteam !== primaryTeamId) {
                        secondaryIdx = i;
                        break;
                    }
                }

                if (secondaryIdx >= 0) {
                    const secondaryId = secondaryIdx + 1;
                    if (oboMap.has(secondaryId)) {
                        const meta = getInningsMeta(secondaryIdx);
                        setWormSecondary({ data: oboMap.get(secondaryId), label: meta.label, color: meta.color });
                    }
                }

                // 4. Initial Matchups OBO
                // Use the OBO data for the current innings (last innings)
                if (oboMap.has(inningsCount)) {
                    setOverByOver(oboMap.get(inningsCount));
                }

                // Set default innings for charts
                setWagonWheelInnings(inningsCount);
                setMatchupsInnings(inningsCount);
                setPartnershipsInnings(inningsCount);

                const endTime = performance.now();
                console.log(`✨ Insights Processing completed in ${(endTime - fetchTime).toFixed(2)}ms`);
                console.log(`⏱️ Total Insights Time: ${(endTime - startTime).toFixed(2)}ms`);

            } catch (error) {
                console.error("Error loading insights:", error);
            } finally {
                setIsInsightsLoading(false);
            }
        };

        loadInsights();
    }, [match?.game_id, scorecard?.Innings?.length]);

    // Handler for Manhattan toggle
    const handleManhattanInningsChange = (inningsIdx: number) => {
        setManhattanInnings(prev => {
            if (prev.includes(inningsIdx)) {
                const newVal = prev.filter(i => i !== inningsIdx);
                return newVal.length === 0 ? prev : newVal;
            }
            return [...prev, inningsIdx].sort((a, b) => a - b);
        });
    };

    // Handler for Wagon Wheel change
    const handleWagonWheelInningsChange = async (innings: number) => {
        setWagonWheelInnings(innings);
        const splits = await fetchBatsmanSplits(match.game_id, innings);
        if (splits) setBatsmanSplits(splits);
    };

    // Handler for Matchups change
    const handleMatchupsInningsChange = async (innings: number) => {
        setMatchupsInnings(innings);
        const [splits, obo] = await Promise.all([
            fetchBatsmanSplits(match.game_id, innings),
            fetchOverByOver(match.game_id, innings)
        ]);
        if (splits) setBatsmanSplits(splits);
        if (obo) setOverByOver(obo);
    };

    // Get Player of the Match
    const getPlayerOfMatch = () => {
        const detail = scorecard?.Matchdetail;
        if (!detail) return null;

        // Check primary object
        if (detail.Player_Of_The_Match) {
            const pom = detail.Player_Of_The_Match;
            return {
                name: pom.Name_Full || pom.Name,
                id: pom.Id
            };
        }

        // Check flat fields (Fallback)
        if (detail.Player_Match && detail.Player_Match_Id) {
            return {
                name: detail.Player_Match,
                id: detail.Player_Match_Id
            };
        }

        return null;
    };
    const playerOfMatch = getPlayerOfMatch();

    // Get Score for Team
    const getTeamScore = (teamId: string | undefined) => {
        if (!teamId || !scorecard?.Innings?.length) return '';
        const teamInnings = scorecard.Innings.filter((inn: any) => inn.Battingteam === teamId);
        if (teamInnings.length === 0) return '';

        const scores = teamInnings.map((inn: any) => {
            const score = `${inn.Total}/${inn.Wickets}`;
            const overs = inn.Overs ? ` (${inn.Overs})` : '';
            return `${score}${overs}`;
        });
        return scores.join(' & ');
    };

    // Get innings label
    const getInningsLabel = (inn: any, idx: number) => {
        const teamName = scorecard?.Teams?.[inn.Battingteam]?.Name_Short || 'Team';
        const inningsNum = Math.floor(idx / 2) + 1;
        return `${teamName} ${inningsNum}`;
    };

    // Determine winner
    const getWinnerId = () => {
        // Check participant highlight
        const highlightedTeam = match.participants?.find(p => p.highlight === 'true');
        if (highlightedTeam) return highlightedTeam.id;

        // Check short_event_status for team name
        const status = match.short_event_status || match.result || '';
        if (team1?.short_name && status.includes(team1.short_name)) return team1.id;
        if (team2?.short_name && status.includes(team2.short_name)) return team2.id;

        return null;
    };
    const winnerId = getWinnerId();
    const isDraw = match.result_code === 'D' || match.result?.toLowerCase().includes('draw');
    const isT1Winner = !isDraw && team1?.id === winnerId;
    const isT2Winner = !isDraw && team2?.id === winnerId;

    // Hero Card Style
    const heroStyle: React.CSSProperties = {
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0f0f14',
        backgroundImage: `
            radial-gradient(ellipse 50% 60% at 10% 50%, ${color1}25 0%, transparent 100%),
            radial-gradient(ellipse 50% 60% at 90% 50%, ${color2}25 0%, transparent 100%)
        `,
        borderRadius: 20,
        padding: 24,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    };

    const selectedInn = scorecard?.Innings?.[selectedInningsIdx];

    return (
        <div className="upcoming-detail">
            {/* Hero Card */}
            <div className="upcoming-hero" style={heroStyle}>
                {/* Series Name - Clickable */}
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

                {/* Match Info Chips */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {match.event_name && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: 20, color: '#3b82f6' }}>
                            {match.event_name}
                        </span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: 20, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 5, height: 5, background: '#a78bfa', borderRadius: '50%' }} />
                        Completed
                    </span>
                </div>

                {/* Teams */}
                <div className="upcoming-teams">
                    <div className="upcoming-team">
                        <WikiImage
                            name={team1?.name}
                            id={team1?.id}
                            type="team"
                            className="team-logo-hero"
                            style={getFlagUrl(team1?.name) ? { width: 60, height: 60, objectFit: 'contain' } : { maxHeight: 60, width: 'auto', height: 'auto' }}
                        />
                        <span className="upcoming-team-name left">{team1?.name}</span>
                        <div style={{ marginTop: 4, minHeight: 42, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 18, fontWeight: 700, color: isT1Winner ? '#22c55e' : '#fff' }}>
                                {getTeamScore(team1?.id)}
                            </span>
                        </div>
                    </div>

                    <div className="upcoming-vs">
                        <span className="vs-text">VS</span>
                    </div>

                    <div className="upcoming-team right-align">
                        <WikiImage
                            name={team2?.name}
                            id={team2?.id}
                            type="team"
                            className="team-logo-hero"
                            style={getFlagUrl(team2?.name) ? { width: 60, height: 60, objectFit: 'contain' } : { maxHeight: 60, width: 'auto', height: 'auto' }}
                        />
                        <span className="upcoming-team-name right">{team2?.name}</span>
                        <div style={{ marginTop: 4, minHeight: 42, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 18, fontWeight: 700, color: isT2Winner ? '#22c55e' : '#fff' }}>
                                {getTeamScore(team2?.id)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Result Banner */}
                {(match.short_event_status || match.event_sub_status || match.result) && (
                    <div style={{
                        textAlign: 'center',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#22c55e',
                        marginTop: 16,
                        padding: '10px 16px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: 12,
                        border: '1px solid rgba(34, 197, 94, 0.2)'
                    }}>
                        {match.short_event_status || match.event_sub_status || match.result}
                    </div>
                )}

                {/* Venue */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    {match.venue || match.venue_name || scorecard?.Matchdetail?.Venue?.Name}
                </div>
            </div>

            {/* Content Sections */}
            <div className="section-container fade-in">
                {/* Player of the Match */}
                {playerOfMatch && (
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 20,
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16
                    }}>
                        <WikiImage name={playerOfMatch.name} id={playerOfMatch.id} type="player" style={{ width: 56, height: 56 }} circle={true} />
                        <div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Player of the Match</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{playerOfMatch.name}</div>
                        </div>
                    </div>
                )}

                {/* AI Summary */}
                {aiSummary && (
                    <AIInsightCard summary={aiSummary} model={aiModel || undefined} audioFile={aiAudio || undefined} />
                )}

                {/* Full Scorecard with Innings Tabs */}
                {scorecard?.Innings && scorecard.Innings.length > 0 && selectedInn && (
                    <div style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: 20 }}>
                        {/* Innings Tabs */}
                        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {scorecard.Innings.map((inn: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedInningsIdx(idx)}
                                    style={{
                                        flex: 1,
                                        minWidth: 70,
                                        padding: '12px 16px',
                                        border: 'none',
                                        background: selectedInningsIdx === idx ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                        borderBottom: selectedInningsIdx === idx ? '2px solid #a78bfa' : '2px solid transparent',
                                        color: selectedInningsIdx === idx ? '#a78bfa' : 'rgba(255,255,255,0.6)',
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
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <WikiImage name={pName} id={bat.Batsman} type="player" style={{ width: 32, height: 32 }} circle={true} />
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{pName}</div>
                                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{bat.Howout_short || 'not out'}</div>
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

                        {/* Fall of Wickets */}
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

                        {/* Bowling Table */}
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
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <WikiImage name={pName} id={bowl.Bowler} type="player" style={{ width: 32, height: 32 }} circle={true} />
                                                        <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{pName}</div>
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
                )}

                {/* Insights Section */}
                <LiveInsights
                    match={match}
                    h2hData={h2hData}
                    scorecard={scorecard}
                    batsmanSplits={batsmanSplits}
                    batsmanSplitsMatchups={batsmanSplits}
                    overByOverMatchups={overByOver}
                    overByOver={overByOver}
                    wormPrimary={wormPrimary}
                    wormSecondary={wormSecondary}
                    wagonWheelInnings={wagonWheelInnings}
                    onWagonWheelInningsChange={handleWagonWheelInningsChange}
                    matchupsInnings={matchupsInnings}
                    onMatchupsInningsChange={handleMatchupsInningsChange}
                    partnershipsInnings={partnershipsInnings}
                    onPartnershipsInningsChange={setPartnershipsInnings}
                    manhattanData={manhattanData}
                    manhattanInnings={manhattanInnings}
                    onManhattanInningsChange={handleManhattanInningsChange}
                    isLoading={isInsightsLoading}
                    hideContextSections={true}
                />

                {/* Series Link */}
                {match.series_id && onSeriesClick && (
                    <div
                        onClick={() => onSeriesClick(match.series_id)}
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: 16,
                            padding: 16,
                            marginTop: 20,
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>View Full Series</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{match.series_name}</div>
                        </div>
                        <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>→</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompletedDetail;

