import React, { useState, useEffect, useMemo } from 'react';
import { Match } from '../../types';
import { User } from 'firebase/auth';
import { FantasyTeam } from '../../utils/useFantasyTeam';
import { Contest, ContestEntry } from '../../utils/useContests';
import { calcRealTimeBatFP, calcRealTimeBowlFP, determineFantasyFormat } from '../../utils/fantasyPoints';
import { proxyFetch, WISDEN_SCORECARD } from '../../utils/api';
import WikiImage from '../WikiImage';
import { getTeamColor } from '../../utils/teamColors';
import { LuTrophy, LuUsers, LuCopy, LuCheck, LuChevronDown, LuChevronUp, LuStar } from 'react-icons/lu';
import { supabase } from '../../utils/supabaseClient';
import { LuChevronLeft } from 'react-icons/lu';

interface Props {
    match: Match;
    user: User;
    team: FantasyTeam;
    contest?: Contest | null;
    contestsHook?: any;
    onBack: () => void;
}

interface PlayerFP {
    id: string;
    name: string;
    shortName: string;
    role: 'WK' | 'BAT' | 'AR' | 'BOWL';
    isCaptain: boolean;
    isViceCaptain: boolean;
    teamId: string;
    teamColor: string;
    teamShort: string;
    runs: number; balls: number; fours: number; sixes: number; sr: string;
    howOut: string; isNotOut: boolean; isBatting: boolean; isStriker: boolean;
    wickets: number; runsConceded: number; overs: number; eco: string; isBowling: boolean;
    batFP: number; bowlFP: number; baseFP: number; totalFP: number;
}

interface LbEntry {
    userId: string;
    name: string;
    points: number;
    photoUrl?: string | null;
    players: { id: string; name: string; isCaptain: boolean; isViceCaptain: boolean; totalFP: number; role: string; }[];
}

const ROLE_ORDER: Record<string, number> = { WK: 0, BAT: 1, AR: 2, BOWL: 3 };

const getBallColor = (ball: string): string => {
    const s = String(ball).toUpperCase();
    if (s === 'W') return '#ef4444';
    if (s.includes('WD') || s.includes('NB')) return '#eab308';
    if (s.includes('6')) return '#f97316';
    if (s.includes('4')) return '#22c55e';
    if (s.includes('LB') || (s.includes('B') && !s.includes('NB'))) return '#60a5fa';
    if (s === '0') return '#64748b';
    return '#60a5fa';
};

export default function LiveTeamView({ match, user, team, contest, contestsHook, onBack }: Props) {
    const [players, setPlayers] = useState<PlayerFP[]>([]);
    const [scoreData, setScoreData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState<LbEntry[]>([]);
    const [lbLoading, setLbLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [viewingOpponent, setViewingOpponent] = useState<LbEntry | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!match.start_date) return;
        const updateTimer = () => {
            const now = new Date().getTime();
            const start = new Date(match.start_date!).getTime();
            const diff = start - now;
            if (diff <= 0) {
                setTimeLeft('Starting mometarily');
                return;
            }
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            if (d > 0) setTimeLeft(`${d}d ${h}h`);
            else setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [match.start_date]);

    const t1 = match.participants?.[0];
    const t2 = match.participants?.[1];
    const c1 = getTeamColor(t1?.name || '') || '#666';
    const c2 = getTeamColor(t2?.name || '') || '#666';

    // API sets event_state='L' at toss time (up to 30 mins before first ball).
    // We only unlock opponent teams when the match has actually started.
    const hasMatchStarted = useMemo(() => {
        const hasBalls = scoreData?.Innings?.some((i: any) => parseFloat(i.Total_Balls_Bowled || '0') > 0);
        const pastStartTime = new Date() >= new Date(match.start_date);
        return hasBalls || pastStartTime;
    }, [scoreData, match.start_date]);

    const isLive = match.event_state === 'L';

    // Determine which state to render
    const matchState = useMemo<'upcoming' | 'live' | 'completed'>(() => {
        if (match.event_state === 'C' || match.event_state === 'R') return 'completed';
        if (match.event_state === 'L' && scoreData?.Innings?.some((i: any) => parseInt(i.Total_Balls_Bowled || '0') > 0)) return 'live';
        return 'upcoming';
    }, [match.event_state, scoreData]);

    // ── Load my team's FP from scorecard ──
    const loadPoints = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            console.log('[LiveTeamView] loadPoints for match:', match.game_id);
            const rawRes = await proxyFetch(`${WISDEN_SCORECARD}${match.game_id}`);
            const scorecard = rawRes?.data || rawRes;
            console.log('[LiveTeamView] scorecard:', scorecard ? 'OK' : 'NULL', 'Teams:', Object.keys(scorecard?.Teams || {}).length, 'Innings:', scorecard?.Innings?.length ?? 0);
            if (!scorecard?.Teams) { console.warn('[LiveTeamView] No Teams in scorecard, aborting'); setLoading(false); return; }
            setScoreData(scorecard);

            const meta = new Map<string, { name: string; shortName: string; teamId: string; teamShort: string }>();
            for (const [teamId, td] of Object.entries(scorecard.Teams) as [string, any][]) {
                const tShort = td.Name_Short || td.Name_Full?.slice(0, 3) || teamId;
                if (td.Players) {
                    for (const [pid, pi] of Object.entries(td.Players) as [string, any][]) {
                        meta.set(pid, {
                            name: pi.Name_Full || pi.Name_Short || pid,
                            shortName: pi.Name_Short || pi.Name_Full?.split(' ').pop() || pid,
                            teamId, teamShort: tShort,
                        });
                    }
                }
            }

            const activeBatsmen = new Set<string>(); const strikerIds = new Set<string>(); const activeBowlers = new Set<string>();
            if (scorecard.Innings?.length) {
                const lastInn = scorecard.Innings[scorecard.Innings.length - 1];
                for (const b of (lastInn.Batsmen || [])) {
                    const hasBatted = (parseInt(b.Balls) || 0) > 0 || String(b.Striker).toLowerCase() === 'true' || b.Striker === true;
                    if (hasBatted && (!b.Dismissal || b.Dismissal === '')) {
                        activeBatsmen.add(b.Batsman);
                        if (String(b.Striker).toLowerCase() === 'true' || b.Striker === true) strikerIds.add(b.Batsman);
                    }
                }
                if (lastInn.Partnership_Current?.Batsmen) {
                    for (const pb of lastInn.Partnership_Current.Batsmen) {
                        activeBatsmen.add(pb.Batsman);
                        if (pb.IsStriker === true || String(pb.IsStriker).toLowerCase() === 'true') strikerIds.add(pb.Batsman);
                    }
                }
                for (const b of (lastInn.Bowlers || [])) {
                    if (b.Isbowlingnow || b.Isbowlingnow === 'true' || b.Isbowlingnow === true) activeBowlers.add(b.Bowler);
                }
            }

            const format = determineFantasyFormat(match, scorecard);

            const statsMap = new Map<string, any>();
            for (const inn of (scorecard.Innings || [])) {
                for (const bat of (inn.Batsmen || [])) {
                    const pid = bat.Batsman; if (!pid) continue;
                    const r = parseInt(bat.Runs) || 0, b = parseInt(bat.Balls) || 0, f = parseInt(bat.Fours) || 0, s = parseInt(bat.Sixes) || 0;
                    const fp = calcRealTimeBatFP({ runs: r, balls: b, fours: f, sixes: s }, format);
                    const e = statsMap.get(pid) || { runs: 0, balls: 0, fours: 0, sixes: 0, sr: '0', howOut: '', isNotOut: true, wickets: 0, runsConceded: 0, overs: 0, eco: '0', batFP: 0, bowlFP: 0 };
                    e.runs += r; e.balls += b; e.fours += f; e.sixes += s;
                    e.sr = e.balls > 0 ? ((e.runs / e.balls) * 100).toFixed(0) : '0';
                    e.howOut = bat.Dismissal || ''; e.isNotOut = !bat.Dismissal || bat.Dismissal === '' || bat.Dismissal === 'not out';
                    e.batFP += fp; statsMap.set(pid, e);
                }
                for (const bowl of (inn.Bowlers || [])) {
                    const pid = bowl.Bowler; if (!pid) continue;
                    const w = parseInt(bowl.Wickets) || 0, rc = parseInt(bowl.Runs) || 0, ov = parseFloat(bowl.Overs) || 0;
                    const m = parseInt(bowl.Maidens) || 0, dots = parseInt(bowl.Dots) || 0;
                    const fp = calcRealTimeBowlFP({ wickets: w, runsConceded: rc, overs: ov, dots: dots, maidens: m, lbwBowled: 0 }, format);
                    const e = statsMap.get(pid) || { runs: 0, balls: 0, fours: 0, sixes: 0, sr: '0', howOut: '', isNotOut: true, wickets: 0, runsConceded: 0, overs: 0, eco: '0', batFP: 0, bowlFP: 0 };
                    e.wickets += w; e.runsConceded += rc; e.overs += ov;
                    e.eco = e.overs > 0 ? (e.runsConceded / e.overs).toFixed(1) : '0';
                    e.bowlFP += fp; statsMap.set(pid, e);
                }
            }

            const result: PlayerFP[] = team.players.map(p => {
                const m = meta.get(p.playerId); const s = statsMap.get(p.playerId);
                const baseFP = (s?.batFP || 0) + (s?.bowlFP || 0);
                let totalFP = baseFP;
                if (p.isCaptain) totalFP = baseFP * 2;
                if (p.isViceCaptain) totalFP = baseFP * 1.5;
                return {
                    id: p.playerId, name: m?.name || `Player ${p.playerId}`, shortName: m?.shortName || p.playerId,
                    role: p.role, isCaptain: p.isCaptain, isViceCaptain: p.isViceCaptain,
                    teamId: m?.teamId || '', teamColor: m?.teamId === t1?.id ? c1 : c2, teamShort: m?.teamShort || '',
                    runs: s?.runs || 0, balls: s?.balls || 0, fours: s?.fours || 0, sixes: s?.sixes || 0, sr: s?.sr || '0',
                    howOut: s?.howOut || '', isNotOut: s?.isNotOut ?? true,
                    isBatting: activeBatsmen.has(p.playerId), isStriker: strikerIds.has(p.playerId),
                    wickets: s?.wickets || 0, runsConceded: s?.runsConceded || 0, overs: s?.overs || 0, eco: s?.eco || '0',
                    isBowling: activeBowlers.has(p.playerId),
                    batFP: s?.batFP || 0, bowlFP: s?.bowlFP || 0, baseFP, totalFP,
                };
            });
            result.sort((a, b) => b.totalFP - a.totalFP);
            setPlayers(result);
        } catch { /* silent */ } finally { setLoading(false); }
    };

    useEffect(() => {
        loadPoints();
        if (isLive) { const i = setInterval(() => loadPoints(true), 15000); return () => clearInterval(i); }
    }, [match.game_id]);

    // ── Load leaderboard (all members + per-player FP) ──
    const loadLeaderboard = async () => {
        if (!contest || !contestsHook) return;
        setLbLoading(true);
        try {
            const entries: ContestEntry[] = await contestsHook.getLeaderboard(contest.id);
            const hasInnings = scoreData?.Innings?.some((i: any) => parseInt(i.Total_Balls_Bowled || '0') > 0);

            // Build stats map
            const statsMap = new Map<string, { batFP: number; bowlFP: number }>();
            if (hasInnings && scoreData) {
                const format = determineFantasyFormat(match, scoreData);
                for (const inn of (scoreData.Innings || [])) {
                    for (const bat of (inn.Batsmen || [])) {
                        const pid = bat.Batsman; if (!pid) continue;
                        const fp = calcRealTimeBatFP({ runs: parseInt(bat.Runs) || 0, balls: parseInt(bat.Balls) || 0, fours: parseInt(bat.Fours) || 0, sixes: parseInt(bat.Sixes) || 0 }, format);
                        const e = statsMap.get(pid) || { batFP: 0, bowlFP: 0 }; e.batFP += fp; statsMap.set(pid, e);
                    }
                    for (const bowl of (inn.Bowlers || [])) {
                        const pid = bowl.Bowler; if (!pid) continue;
                        const fp = calcRealTimeBowlFP({ wickets: parseInt(bowl.Wickets) || 0, runsConceded: parseInt(bowl.Runs) || 0, overs: parseFloat(bowl.Overs) || 0, dots: parseInt(bowl.Dots) || 0, maidens: parseInt(bowl.Maidens) || 0, lbwBowled: 0 }, format);
                        const e = statsMap.get(pid) || { batFP: 0, bowlFP: 0 }; e.bowlFP += fp; statsMap.set(pid, e);
                    }
                }
            }

            // Build name map from scorecard
            const nameMap = new Map<string, string>();
            if (scoreData?.Teams) {
                for (const [, td] of Object.entries(scoreData.Teams) as [string, any][]) {
                    if (td.Players) {
                        for (const [pid, pi] of Object.entries(td.Players) as [string, any][]) {
                            nameMap.set(pid, (pi as any).Name_Full || (pi as any).Name_Short || pid);
                        }
                    }
                }
            }

            const results = await Promise.all(entries.map(async (entry: ContestEntry) => {
                // My own entry
                if (entry.user_id === user.uid) {
                    const myPlayers = players.map(p => ({
                        id: p.id, name: p.name, isCaptain: p.isCaptain, isViceCaptain: p.isViceCaptain,
                        totalFP: Math.round(p.totalFP), role: p.role,
                    }));
                    return { userId: entry.user_id, name: entry.display_name, photoUrl: user.photoURL || entry.photo_url, points: Math.round(players.reduce((s, p) => s + p.totalFP, 0)), players: myPlayers };
                }

                // Opponent's team
                const { data: teamData } = await supabase
                    .from('fantasy_teams').select('players')
                    .eq('user_id', entry.user_id).eq('match_id', match.game_id).single();

                if (!teamData?.players) return { userId: entry.user_id, name: entry.display_name, points: 0, players: [] };

                const oppPlayers: LbEntry['players'] = teamData.players.map((p: any) => {
                    const s = statsMap.get(p.playerId);
                    const base = (s?.batFP || 0) + (s?.bowlFP || 0);
                    const totalFP = Math.round(p.isCaptain ? base * 2 : p.isViceCaptain ? base * 1.5 : base);
                    return { id: p.playerId, name: nameMap.get(p.playerId) || p.playerId, isCaptain: p.isCaptain, isViceCaptain: p.isViceCaptain, totalFP, role: p.role || '' };
                });
                oppPlayers.sort((a, b) => b.totalFP - a.totalFP);
                return { userId: entry.user_id, name: entry.display_name, photoUrl: entry.photo_url, points: oppPlayers.reduce((s, p) => s + p.totalFP, 0), players: oppPlayers };
            }));

            results.sort((a, b) => b.points - a.points);
            setLeaderboard(results);
        } catch (err) { console.error('lb error', err); } finally { setLbLoading(false); }
    };

    useEffect(() => { if (contest) loadLeaderboard(); }, [contest?.id, scoreData, players.length]);

    const totalPoints = useMemo(() => Math.round(players.reduce((s, p) => s + p.totalFP, 0)), [players]);
    const myRank = useMemo(() => {
        if (!leaderboard.length) return null;
        const idx = leaderboard.findIndex(e => e.userId === user.uid);
        return idx >= 0 ? idx + 1 : null;
    }, [leaderboard, user.uid]);

    // ── Match panel (live score data) ──
    const matchPanel = useMemo(() => {
        if (!scoreData?.Innings?.length) return null;
        const lastInn = scoreData.Innings[scoreData.Innings.length - 1];
        const battingTeamId = lastInn.Battingteam;
        const bowlingTeamId = battingTeamId === t1?.id ? t2?.id : t1?.id;
        const allPlayers = scoreData.Teams?.[battingTeamId]?.Players || {};
        const bowlPlayers = scoreData.Teams?.[bowlingTeamId]?.Players || {};
        const isSquadPlayer = (id: string) => players.some(p => p.id === id);

        const activeBats = (lastInn.Batsmen || []).filter((b: any) => !b.Dismissal || b.Dismissal === '');
        let strikerId: string | null = null;
        if (lastInn.Partnership_Current?.Batsmen) {
            for (const pb of lastInn.Partnership_Current.Batsmen) {
                if (pb.IsStriker === true || String(pb.IsStriker).toLowerCase() === 'true') strikerId = pb.Batsman;
            }
        }
        if (!strikerId && activeBats.length > 0) {
            const s = activeBats.find((b: any) => String(b.Striker).toLowerCase() === 'true' || b.Striker === true);
            strikerId = s?.Batsman || activeBats[0]?.Batsman;
        }
        const striker = activeBats.find((b: any) => b.Batsman === strikerId);
        const nonStriker = activeBats.find((b: any) => b.Batsman !== strikerId);
        const bowlers = lastInn.Bowlers || [];
        const activeBowler = bowlers.find((b: any) => b.Isbowlingnow || b.Isbowlingnow === 'true' || b.Isbowlingnow === true) || bowlers[bowlers.length - 1];

        let thisOver: string[] = [];
        if (activeBowler?.ThisOver) {
            thisOver = activeBowler.ThisOver.map((ball: any) => {
                if (typeof ball === 'string') return ball;
                const r = ball.B || '0'; const t = ball.T ? ball.T.toUpperCase() : '';
                if (t === 'W') return 'W'; if (t === 'WD') return `${r}WD`; if (t === 'NB') return `${r}NB`;
                if (t === 'LB') return `${r}LB`; if (t === 'B') return `${r}B`; return r;
            });
        }

        const crr = parseFloat(lastInn.Runrate) || 0;
        let rrr: number | null = null;
        if (scoreData.Innings.length >= 2) {
            const prevInn = scoreData.Innings[scoreData.Innings.length - 2];
            const target = (parseInt(prevInn.Total) || 0) + 1;
            const curr = parseInt(lastInn.Total) || 0;
            const needed = target - curr;
            const totalBalls = parseInt(lastInn.AllotedBalls) || 120;
            const bowled = parseInt(lastInn.Total_Balls_Bowled) || 0;
            const remaining = totalBalls - bowled;
            if (needed > 0 && remaining > 0) rrr = (needed / remaining) * 6;
        }

        const scores = scoreData.Innings.map((inn: any, i: number) => {
            const tid = inn.Battingteam;
            const td = scoreData.Teams[tid];
            return { short: td?.Name_Short || tid, total: inn.Total, wickets: inn.Wickets, overs: inn.Overs, isCurrent: i === scoreData.Innings.length - 1, color: getTeamColor(td?.Name_Full || '') || '#666' };
        });

        return {
            striker: striker ? { name: allPlayers[striker.Batsman]?.Name_Full || allPlayers[striker.Batsman]?.Name_Short || striker.Batsman, runs: striker.Runs, balls: striker.Balls, fours: striker.Fours, sixes: striker.Sixes, id: striker.Batsman, inSquad: isSquadPlayer(striker.Batsman) } : null,
            nonStriker: nonStriker ? { name: allPlayers[nonStriker.Batsman]?.Name_Full || allPlayers[nonStriker.Batsman]?.Name_Short || nonStriker.Batsman, runs: nonStriker.Runs, balls: nonStriker.Balls, id: nonStriker.Batsman, inSquad: isSquadPlayer(nonStriker.Batsman) } : null,
            bowler: activeBowler ? { name: bowlPlayers[activeBowler.Bowler]?.Name_Full || bowlPlayers[activeBowler.Bowler]?.Name_Short || activeBowler.Bowler, wickets: activeBowler.Wickets, runs: activeBowler.Runs, overs: activeBowler.Overs, id: activeBowler.Bowler, inSquad: isSquadPlayer(activeBowler.Bowler) } : null,
            thisOver, crr, rrr, scores, partnership: lastInn.Partnership_Current,
            status: scoreData.Matchdetail?.Status || scoreData.Matchdetail?.Equation || match.event_status || '',
        };
    }, [scoreData, players]);

    const copyCode = () => {
        if (contest?.code) { navigator.clipboard?.writeText(contest.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    };

    // ── Shared: player grid ──
    const renderPlayerGrid = (playersList: PlayerFP[] | LbEntry['players'], showFP: boolean) => (
        <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 10,
        }}>
            {playersList.map((p: any) => (
                <div key={p.id} style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)',
                    padding: '10px 6px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}>
                    {/* Top Team Color Accent */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: p.teamColor || '#ec4899', opacity: 0.8 }} />

                    {/* Badge */}
                    {(p.isCaptain || p.isViceCaptain) && (
                        <div style={{
                            position: 'absolute', top: 4, left: 4, zIndex: 2,
                            background: p.isCaptain ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #818cf8, #6366f1)',
                            color: '#fff', fontSize: 8, fontWeight: 900, padding: '2px 4px', borderRadius: 4,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                        }}>{p.isCaptain ? 'C' : 'VC'}</div>
                    )}

                    {/* Photo */}
                    <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: 8, border: `1px solid ${p.teamColor || 'rgba(255,255,255,0.1)'}`, padding: 2 }}>
                        <WikiImage type="player" id={p.id} name={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    </div>

                    {/* Name */}
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: showFP ? 6 : 0 }}>
                        {p.name}
                    </div>

                    {/* Points */}
                    {showFP && (
                        <div style={{ textAlign: 'center', marginTop: 'auto' }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: p.totalFP > 0 ? '#4ade80' : 'rgba(255,255,255,0.4)', textShadow: p.totalFP > 0 ? '0 2px 8px rgba(74,222,128,0.2)' : 'none' }}>
                                {p.totalFP}
                            </div>
                            <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PTS</div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    // ── Shared: leaderboard row (opens overlay) ──
    const renderLbRow = (entry: LbEntry, rank: number) => {
        const isMe = entry.userId === user.uid;
        const showScores = matchState !== 'upcoming' && hasMatchStarted;
        const canExpand = isMe || showScores; // Cannot expand opponents pre-match

        const medalColor = rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : rank === 3 ? '#b45309' : null;

        // Premium floating card styling (toned down gradients)
        const bgColors = isMe
            ? 'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(236,72,153,0.01) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)';

        const borderColor = isMe
            ? 'rgba(236,72,153,0.3)'
            : 'rgba(255,255,255,0.08)';

        return (
            <div key={entry.userId} style={{
                marginBottom: 12,
                // Float animation handled via standard css or inline transition
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}>
                <div
                    onClick={() => {
                        if (!canExpand) return;
                        setViewingOpponent(isMe ? { ...entry, name: 'Your' } : entry);
                    }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: canExpand ? 'pointer' : 'default',
                        background: bgColors,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 20, // More pill-like
                        position: 'relative',
                        boxShadow: isMe
                            ? '0 8px 32px rgba(236,72,153,0.15), 0 2px 8px rgba(0,0,0,0.4)'
                            : '0 8px 32px rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(10px)',
                        overflow: 'hidden'
                    }}
                >
                    {/* Subtle pulse glow for "Me" completely removed for cleaner look */}

                    {/* Avatar Container with overlapping Rank badge */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: isMe ? '2px solid #ec4899' : '2px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                            {entry.photoUrl ? (
                                <img src={entry.photoUrl} alt={entry.name} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: isMe ? '#ec4899' : 'rgba(255,255,255,0.6)' }}>
                                    {entry.name?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                        </div>

                        {/* Overlapping Rank Badge */}
                        <div style={{
                            position: 'absolute', bottom: -4, right: -4,
                            width: 22, height: 22, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: medalColor ? medalColor : '#1e293b',
                            border: '2px solid #0a0a12', // Match dark bg to "cut out"
                            boxShadow: '0 2px 4px rgba(0,0,0,0.5)', zIndex: 2
                        }}>
                            <span style={{ fontSize: 10, fontWeight: 900, color: medalColor ? '#000' : 'rgba(255,255,255,0.8)' }}>
                                {rank}
                            </span>
                        </div>
                    </div>

                    {/* Name block */}
                    <div style={{ flex: 1, minWidth: 0, paddingLeft: 4, zIndex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: isMe ? '#fff' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px' }}>
                            {entry.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            {isMe && <span style={{ fontSize: 9, fontWeight: 800, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'rgba(236,72,153,0.15)', padding: '2px 6px', borderRadius: 4 }}>You</span>}
                            {!isMe && !showScores && <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Squad Hidden</span>}
                        </div>
                    </div>

                    {/* Points & Action block */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1 }}>
                        {showScores && (
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 24, fontWeight: 900, color: isMe ? '#ec4899' : '#fff', letterSpacing: -1, lineHeight: 1 }}>
                                    {entry.points}
                                </div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 3 }}>
                                    Points
                                </div>
                            </div>
                        )}
                        {canExpand && (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                                <LuChevronLeft size={16} color="rgba(255,255,255,0.8)" style={{ transform: 'rotate(180deg)' }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ── Loading ──
    if (loading) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div className="login-spinner" style={{ margin: '0 auto 16px', borderColor: '#ec4899', borderRightColor: 'transparent' }} />
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Loading...</div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', paddingBottom: 120 }}>

            {/* ── League Header (Redesigned & Toned Down) ── */}
            {contest && (
                <div style={{ margin: '16px 16px 24px', padding: '20px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>

                    {/* Background glow & icon (Toned down) */}
                    <LuTrophy size={80} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: -10, bottom: -10, transform: 'rotate(10deg)' }} />

                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1, paddingRight: 16 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(236,72,153,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                                    Private League
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                    {contest.name}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <LuUsers size={14} color="#fff" />
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{contest.entry_count}<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}> / {contest.max_entries}</span></div>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spots</div>
                                </div>
                            </div>
                        </div>

                        {/* Invite Code Block (Wider) */}
                        <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                            <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }} onClick={copyCode}>
                                <div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, marginBottom: 4 }}>Invite Code</div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Tap to copy & share</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 900, color: copied ? '#4ade80' : '#fff', letterSpacing: '2px' }}>{contest.code?.toUpperCase()}</span>
                                    {copied ? <LuCheck size={20} color="#4ade80" /> : <LuCopy size={20} color="rgba(255,255,255,0.4)" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ UPCOMING STATE ════════ */}
            {matchState === 'upcoming' && (
                <div style={{ padding: '0 16px' }}>

                    {/* Pre-Match Hub Card */}
                    <div style={{
                        marginBottom: 28, padding: '20px', borderRadius: 20,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(10px)',
                        textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <LuUsers size={24} color="#ec4899" />
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', marginBottom: 6 }}>
                            Waiting for the Toss
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 20 }}>
                            Opponent squads are hidden to prevent copying. They will be revealed right here as soon as the first ball is bowled!
                        </div>

                        <div style={{ display: 'flex', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, textAlign: 'left' }}>
                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 12 }}>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Match Starts</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                                    {match.start_date ? new Date(match.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Soon'}
                                </div>
                            </div>
                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 12 }}>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Countdown</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: '#ec4899', letterSpacing: '0.5px', fontFamily: 'monospace' }}>
                                    {timeLeft || '...'}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <button onClick={onBack} style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backdropFilter: 'blur(10px)' }}>
                                Edit Your Squad
                            </button>
                        </div>
                    </div>

                    {/* League members */}
                    {contest && (
                        <div style={{ marginBottom: 28 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>
                                    Joined Members
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(236,72,153,0.8)', background: 'rgba(236,72,153,0.1)', padding: '4px 8px', borderRadius: 6 }}>
                                    Squads Hidden
                                </div>
                            </div>
                            {lbLoading ? (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div className="login-spinner" style={{ margin: '0 auto', borderColor: '#ec4899', borderRightColor: 'transparent' }} />
                                </div>
                            ) : (
                                leaderboard.map((entry, idx) => renderLbRow(entry, idx + 1))
                            )}
                        </div>
                    )}

                    {/* Your squad — Grid layout */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                            Your Squad
                        </div>
                        {renderPlayerGrid(
                            [...players].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)),
                            false
                        )}
                    </div>
                </div>
            )}

            {/* ════════ LIVE STATE ════════ */}
            {matchState === 'live' && (
                <div>
                    {/* Live score panel */}
                    {matchPanel && (
                        <div style={{ margin: '0 16px 12px', padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {/* Scores */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 12 }}>
                                {matchPanel.scores.map((s: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 4, opacity: s.isCurrent ? 1 : 0.5 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.short}</span>
                                        <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{s.total}/{s.wickets}</span>
                                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>({s.overs})</span>
                                    </div>
                                ))}
                            </div>

                            {/* Striker / Center / Non-Striker */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Striker</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{matchPanel.striker?.name || '–'}</span>
                                        {matchPanel.striker?.inSquad && <span style={{ fontSize: 6, fontWeight: 900, background: '#4ade80', color: '#000', padding: '1px 3px', borderRadius: 3, flexShrink: 0 }}>SQUAD</span>}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{matchPanel.striker?.runs || '0'}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>({matchPanel.striker?.balls || '0'})</span></div>
                                </div>

                                <div style={{ textAlign: 'center', minWidth: 56 }}>
                                    {matchPanel.partnership && (
                                        <>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{matchPanel.partnership.Runs}<span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>({matchPanel.partnership.Balls})</span></div>
                                            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Pship</div>
                                        </>
                                    )}
                                    <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 1 }}>Bowler</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                        <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 60 }}>{matchPanel.bowler?.name || '–'}</span>
                                        {matchPanel.bowler?.inSquad && <span style={{ fontSize: 5, fontWeight: 900, background: '#4ade80', color: '#000', padding: '0px 2px', borderRadius: 2 }}>✓</span>}
                                    </div>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{matchPanel.bowler ? `${matchPanel.bowler.wickets}/${matchPanel.bowler.runs} (${matchPanel.bowler.overs})` : '–'}</div>
                                </div>

                                <div style={{ flex: 1, textAlign: 'right' }}>
                                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Non-Striker</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                        {matchPanel.nonStriker?.inSquad && <span style={{ fontSize: 6, fontWeight: 900, background: '#4ade80', color: '#000', padding: '1px 3px', borderRadius: 3, flexShrink: 0 }}>SQUAD</span>}
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{matchPanel.nonStriker?.name || '–'}</span>
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', textAlign: 'right' }}>{matchPanel.nonStriker?.runs || '0'}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>({matchPanel.nonStriker?.balls || '0'})</span></div>
                                </div>
                            </div>

                            {/* CRR / RRR + This Over */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                                <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', padding: '3px 6px', borderRadius: 4 }}>
                                    CRR <span style={{ color: '#60a5fa', fontWeight: 700 }}>{matchPanel.crr.toFixed(2)}</span>
                                </span>
                                {matchPanel.rrr !== null && (
                                    <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', padding: '3px 6px', borderRadius: 4 }}>
                                        RRR <span style={{ color: matchPanel.rrr > matchPanel.crr ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{matchPanel.rrr.toFixed(2)}</span>
                                    </span>
                                )}
                                <div style={{ flex: 1, display: 'flex', gap: 3, justifyContent: 'flex-end', alignItems: 'center' }}>
                                    {matchPanel.thisOver.length > 0 && (
                                        <>
                                            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', flexShrink: 0 }}>This Ov</span>
                                            {matchPanel.thisOver.map((ball: string, i: number) => (
                                                <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: getBallColor(ball) + '20', border: `1.5px solid ${getBallColor(ball)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: getBallColor(ball) }}>{ball}</div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                            {matchPanel.status && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textAlign: 'center', marginTop: 8 }}>{matchPanel.status}</div>}
                        </div>
                    )}

                    {/* Points + Rank cards */}
                    <div style={{ margin: '0 16px 20px', display: 'flex', gap: 12 }}>
                        {/* Points Card */}
                        <div style={{
                            flex: 1, padding: '20px 16px', borderRadius: 20, textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(236,72,153,0.01))',
                            border: '1px solid rgba(236,72,153,0.1)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden'
                        }}>
                            {/* Inner glow removed */}
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>Your Points</div>
                            <div style={{ fontSize: 42, fontWeight: 900, color: '#ec4899', letterSpacing: -2, lineHeight: 1 }}>{totalPoints}</div>
                        </div>

                        {/* Rank Card */}
                        {myRank && leaderboard.length > 1 && (
                            <div style={{
                                flex: 1, padding: '20px 16px', borderRadius: 20, textAlign: 'center',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
                                border: '1px solid rgba(255,255,255,0.08)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden'
                            }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>Your Rank</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                                    <span style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: -2, lineHeight: 1 }}>#{myRank}</span>
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>of {leaderboard.length}</div>
                            </div>
                        )}
                    </div>

                    {/* Live leaderboard */}
                    <div style={{ padding: '0 16px' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                            League Standings — tap to view team
                        </div>
                        {lbLoading ? (
                            <div style={{ textAlign: 'center', padding: '30px 0' }}>
                                <div className="login-spinner" style={{ margin: '0 auto 10px', borderColor: '#ec4899', borderRightColor: 'transparent' }} />
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Calculating...</div>
                            </div>
                        ) : (
                            leaderboard.map((entry, idx) => renderLbRow(entry, idx + 1))
                        )}
                    </div>
                </div>
            )}

            {/* ════════ COMPLETED STATE ════════ */}
            {matchState === 'completed' && (
                <div style={{ padding: '16px' }}>

                    {/* Result Card */}
                    <div style={{
                        marginBottom: 24, padding: '24px 20px', borderRadius: 24,
                        background: myRank === 1
                            ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.03))'
                            : 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.03))',
                        border: myRank === 1 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(236,72,153,0.3)',
                        boxShadow: myRank === 1 ? '0 8px 32px rgba(245,158,11,0.2)' : '0 8px 32px rgba(236,72,153,0.15)',
                        textAlign: 'center', position: 'relative', overflow: 'hidden'
                    }}>
                        {/* Glow effect toned down significantly */}
                        <div style={{
                            position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
                            width: 100, height: 100, borderRadius: '50%', filter: 'blur(20px)', opacity: 0.05,
                            background: myRank === 1 ? '#f59e0b' : '#ec4899'
                        }} />

                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: myRank === 1 ? 'rgba(245,158,11,0.8)' : 'rgba(236,72,153,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                                Final Result
                            </div>

                            {myRank === 1 ? (
                                <div style={{ fontSize: 42, fontWeight: 900, color: '#f59e0b', letterSpacing: '-1.5px', lineHeight: 1 }}>You Won!</div>
                            ) : myRank ? (
                                <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.8px' }}>
                                    Finished <span style={{ color: '#ec4899' }}>#{myRank}</span>
                                </div>
                            ) : (
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Match Over</div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 8, fontSize: 14, fontWeight: 800, color: '#fff' }}>
                                    {totalPoints} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase' }}>pts</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Best player Card */}
                    {players[0] && (
                        <div style={{
                            marginBottom: 28, padding: '16px', borderRadius: 20,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                            display: 'flex', alignItems: 'center', gap: 14, backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <LuStar size={20} color="#f59e0b" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>Star Player</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>{players[0].name}</div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                    {players[0].isCaptain && <span style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '2px 6px', borderRadius: 4 }}>CAPTAIN · 2x</span>}
                                    {players[0].isViceCaptain && <span style={{ fontSize: 9, fontWeight: 800, color: '#818cf8', background: 'rgba(129,140,248,0.15)', padding: '2px 6px', borderRadius: 4 }}>VICE · 1.5x</span>}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', letterSpacing: -1, lineHeight: 1 }}>{Math.round(players[0].totalFP)}</div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(245,158,11,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 3 }}>Points</div>
                            </div>
                        </div>
                    )}

                    {/* Final standings */}
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                        Final Standings — tap to view team
                    </div>
                    {lbLoading ? (
                        <div style={{ textAlign: 'center', padding: '30px 0' }}>
                            <div className="login-spinner" style={{ margin: '0 auto 10px', borderColor: '#ec4899', borderRightColor: 'transparent' }} />
                        </div>
                    ) : (
                        leaderboard.map((entry, idx) => renderLbRow(entry, idx + 1))
                    )}
                </div>
            )}

            {/* ════════ OPPONENT SQUAD OVERLAY ════════ */}
            {viewingOpponent && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 2500,
                    background: '#0a0a12', overflowY: 'auto',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                    {/* Spacer for FloatingHeader */}
                    <div style={{ height: 85 }}></div>

                    {/* Header */}
                    <div style={{
                        position: 'sticky', top: 85, zIndex: 10,
                        background: 'rgba(10,10,18,0.85)', backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16
                    }}>
                        <button
                            onClick={() => setViewingOpponent(null)}
                            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                        >
                            <LuChevronLeft size={20} />
                        </button>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Fantasy Squad</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {viewingOpponent.name === 'Your' ? 'Your Team' : `${viewingOpponent.name}'s Team`}
                            </div>
                        </div>
                        {matchState !== 'upcoming' && hasMatchStarted && (
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 24, fontWeight: 900, color: '#4ade80', letterSpacing: -1, lineHeight: 1 }}>{viewingOpponent.points}</div>
                                <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(74,222,128,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>TOTAL PTS</div>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '24px 16px 60px' }}>
                        {viewingOpponent.players.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                                No squad data available.
                            </div>
                        ) : (
                            renderPlayerGrid(viewingOpponent.players, matchState !== 'upcoming' && hasMatchStarted)
                        )}
                    </div>

                    <style>{`
                        @keyframes slideUp {
                            from { transform: translateY(100%); }
                            to { transform: translateY(0); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
