/**
 * Dream 11 Team Predictor Engine v2
 * 
 * Scores all players using 5 weighted signals:
 * - Tournament Form (35%) — Fantasy Points simulation with recency decay
 * - Career Stats (20%) — from Scorecard with tighter T20I normalization
 * - ICC Ranking (15%) — team rank + career differentiation
 * - Role Value (15%) — AR/WK multiplier + batting position value
 * - Pitch Fit (15%) — batting/bowling/spin pitch boosts
 * 
 * v2 improvements:
 * - Fantasy Points simulation (actual D11 point values)
 * - Recency decay (latest innings weighted higher)
 * - Batting position value (top-order bonus)
 * - Consistency bonus
 * - Better role detection from innings counts
 * - Tighter career stat normalization ranges
 */

import { supabase } from './supabaseClient';
import { proxyFetch } from './api';
import { CLIENT_SCORECARD } from './wisdenConfig';

// ============ TYPES ============

export type D11Role = 'WK' | 'BAT' | 'AR' | 'BOWL';

export interface MatchByMatchEntry {
    matchId: string;
    date: string;
    opponent?: string;
    runs?: number;
    balls?: number;
    sr?: number;
    fours?: number;
    sixes?: number;
    wickets?: number;
    eco?: number;
    bowlingRuns?: number;
    overs?: number;
}

export interface TournamentFormBreakdown {
    score: number;
    batting: {
        innings: number;
        avgRuns: number;
        avgSR: number;
        boundaryPct: number;
    };
    bowling: {
        innings: number;
        avgWickets: number;
        avgEco: number;
        dotPct: number;
    };
    matchByMatch: MatchByMatchEntry[];
    reasoning: string;
}

export interface CareerStatsBreakdown {
    score: number;
    battingAvg: number;
    battingSR: number;
    totalRuns: number;
    bowlingEco: number;
    totalWickets: number;
    matches: number;
    reasoning: string;
}

export interface ICCRankingBreakdown {
    score: number;
    rank: number | null;
    reasoning: string;
}

export interface RoleValueBreakdown {
    score: number;
    role: string;
    skillName: string;
    multiplier: number;
    isCaptain: boolean;
    isKeeper: boolean;
    reasoning: string;
}

export interface PitchFitBreakdown {
    score: number;
    pitchType: string;
    playerType: string;
    avgSpeed?: number;
    reasoning: string;
}

export interface PlayerScore {
    playerId: string;
    name: string;
    shortName: string;
    team: string;
    teamId: string;
    role: D11Role;
    totalScore: number;
    selected: boolean;
    isCaptain: boolean;
    isViceCaptain: boolean;
    tournamentForm: TournamentFormBreakdown;
    careerStats: CareerStatsBreakdown;
    iccRanking: ICCRankingBreakdown;
    roleValue: RoleValueBreakdown;
    pitchFit: PitchFitBreakdown;
}

export interface Dream11Prediction {
    matchId: string;
    team1: { name: string; id: string; shortName: string };
    team2: { name: string; id: string; shortName: string };
    venue: string;
    pitchType: string;
    seriesId: string;
    selectedTeam: PlayerScore[];
    backups: PlayerScore[];
    captain: PlayerScore;
    viceCaptain: PlayerScore;
    allPlayers: PlayerScore[];
    logs: string[];
    loading: boolean;
    error?: string;
}

// ============ WEIGHTS ============

const WEIGHTS = {
    TOURNAMENT_FORM: 0.35,
    CAREER_STATS: 0.20,
    ICC_RANKING: 0.15,
    ROLE_VALUE: 0.15,
    PITCH_FIT: 0.15,
};

// ============ D11 FANTASY POINTS (T20) ============

export const D11 = {
    RUN: 1, FOUR: 1, SIX: 2,
    FIFTY: 16, CENTURY: 16, // additive, so 50+ = 16, 100+ = 32
    DUCK: -2,
    WICKET: 25, FOUR_W: 16, FIVE_W: 16,
    MAIDEN: 16,
    // Economy (min 2 overs)
    ECO_LT5: 6, ECO_5_6: 4, ECO_6_7: 2,
    ECO_9_10: -2, ECO_10_11: -4, ECO_GT11: -6,
    // Strike Rate (min 10 balls)
    SR_GT170: 6, SR_150_170: 4, SR_130_150: 2,
    SR_60_70: -2, SR_50_60: -4, SR_LT50: -6,
};

// ============ HELPERS ============

function normalize(value: number, min: number, max: number): number {
    if (max === min) return 50;
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function recencyWeight(index: number): number {
    return Math.max(0.3, 1.0 - index * 0.18);
}

function mapD11Role(
    skillName: string, role: string, isKeeper: boolean,
    realBatInnings: number, bowlInnings: number
): D11Role {
    if (isKeeper) return 'WK';

    const s = (skillName || '').toLowerCase();
    const r = (role || '').toLowerCase();

    // If API explicitly says "All-Rounder", trust it
    if (s.includes('all') || r.includes('all')) return 'AR';

    // If API says "Bowler", only override to AR if they have significant batting
    // (real innings, not DNB). A bowler with 4 bowl + 0 real bat = BOWL, not AR.
    if (s.includes('bowl') || r.includes('bowl')) {
        if (realBatInnings >= 3 && bowlInnings > 0) {
            // Has enough real batting to potentially be AR — but API says bowler,
            // so only upgrade if bowl innings are also present
            return 'AR';
        }
        return 'BOWL';
    }

    if (s.includes('bat') || r.includes('bat')) return 'BAT';
    if (s.includes('wicket') || r.includes('keeper') || r.includes('wicket')) return 'WK';

    // Fallback: use innings counts
    if (bowlInnings > 0 && realBatInnings === 0) return 'BOWL';
    if (realBatInnings > 0 && bowlInnings > 0 && bowlInnings >= realBatInnings * 0.4) return 'AR';
    return 'BAT';
}

export function calcBatFP(runs: number, balls: number, fours: number, sixes: number): number {
    let fp = runs * D11.RUN + fours * D11.FOUR + sixes * D11.SIX;
    if (runs >= 100) fp += D11.FIFTY + D11.CENTURY;
    else if (runs >= 50) fp += D11.FIFTY;
    if (runs === 0 && balls > 0) fp += D11.DUCK;

    if (balls >= 10) {
        const sr = (runs / balls) * 100;
        if (sr > 170) fp += D11.SR_GT170;
        else if (sr >= 150) fp += D11.SR_150_170;
        else if (sr >= 130) fp += D11.SR_130_150;
        else if (sr < 50) fp += D11.SR_LT50;
        else if (sr < 60) fp += D11.SR_50_60;
        else if (sr < 70) fp += D11.SR_60_70;
    }
    return fp;
}

export function calcBowlFP(wickets: number, runs: number, overs: number): number {
    let fp = wickets * D11.WICKET;
    if (wickets >= 5) fp += D11.FOUR_W + D11.FIVE_W;
    else if (wickets >= 4) fp += D11.FOUR_W;

    if (overs >= 2) {
        const eco = runs / overs;
        if (eco < 5) fp += D11.ECO_LT5;
        else if (eco < 6) fp += D11.ECO_5_6;
        else if (eco < 7) fp += D11.ECO_6_7;
        else if (eco > 11) fp += D11.ECO_GT11;
        else if (eco > 10) fp += D11.ECO_10_11;
        else if (eco > 9) fp += D11.ECO_9_10;
    }
    return fp;
}

// ============ DATA FETCHERS ============

export async function fetchScorecard(gameId: string) {
    const url = `https://www.wisden.com/cricket/v1/game/scorecard?lang=en&feed_format=json&client_id=${CLIENT_SCORECARD}&game_id=${gameId}`;
    const data = await proxyFetch(url);
    return data?.data || null;
}

async function fetchH2H(gameId: string) {
    const url = `https://www.wisden.com/cricket/v1/game/head-to-head?client_id=${CLIENT_SCORECARD}&feed_format=json&game_id=${gameId}&lang=en`;
    const data = await proxyFetch(url);
    return data?.data || null;
}

async function fetchTournamentBatting(playerIds: string[], seriesId: string, excludeMatchId?: string): Promise<Map<string, any[]>> {
    const result = new Map<string, any[]>();
    if (!playerIds.length || !seriesId) return result;

    const { data: matches } = await supabase
        .from('tournament_matches')
        .select('id, match_date, team_home_id, team_away_id')
        .eq('series_id', seriesId)
        .order('match_date', { ascending: false });

    if (!matches?.length) return result;
    const matchIds = matches.map(m => m.id).filter(id => id !== excludeMatchId);

    const { data: innings } = await supabase
        .from('batting_innings')
        .select('*')
        .in('match_id', matchIds)
        .in('player_id', playerIds)
        .order('created_at', { ascending: false });

    if (!innings) return result;

    innings.forEach(inn => {
        if (!result.has(inn.player_id)) result.set(inn.player_id, []);
        const match = matches.find(m => m.id === inn.match_id);
        result.get(inn.player_id)!.push({ ...inn, match_date: match?.match_date });
    });

    return result;
}

async function fetchTournamentBowling(playerIds: string[], seriesId: string, excludeMatchId?: string): Promise<Map<string, any[]>> {
    const result = new Map<string, any[]>();
    if (!playerIds.length || !seriesId) return result;

    const { data: matches } = await supabase
        .from('tournament_matches')
        .select('id, match_date, team_home_id, team_away_id')
        .eq('series_id', seriesId)
        .order('match_date', { ascending: false });

    if (!matches?.length) return result;
    const matchIds = matches.map(m => m.id).filter(id => id !== excludeMatchId);

    const { data: innings } = await supabase
        .from('bowling_innings')
        .select('*')
        .in('match_id', matchIds)
        .in('player_id', playerIds)
        .order('created_at', { ascending: false });

    if (!innings) return result;

    innings.forEach(inn => {
        if (!result.has(inn.player_id)) result.set(inn.player_id, []);
        const match = matches.find(m => m.id === inn.match_id);
        result.get(inn.player_id)!.push({ ...inn, match_date: match?.match_date });
    });

    return result;
}

// ============ SIGNAL SCORERS ============

function scoreTournamentForm(
    playerId: string,
    battingInnings: any[],
    bowlingInnings: any[],
    role: D11Role
): TournamentFormBreakdown {
    const batInns = battingInnings || [];
    const bowlInns = bowlingInnings || [];
    const reasoning: string[] = [];

    // Sort by date descending (most recent first)
    const sortedBat = [...batInns].sort((a, b) =>
        new Date(b.match_date || 0).getTime() - new Date(a.match_date || 0).getTime()
    );
    const sortedBowl = [...bowlInns].sort((a, b) =>
        new Date(b.match_date || 0).getTime() - new Date(a.match_date || 0).getTime()
    );

    // Fantasy Points per innings with recency decay
    let totalWeightedFP = 0;
    let totalWeight = 0;
    const perMatchFP: number[] = [];

    sortedBat.forEach((inn, idx) => {
        const fp = calcBatFP(inn.runs || 0, inn.balls || 0, inn.fours || 0, inn.sixes || 0);
        const w = recencyWeight(idx);
        totalWeightedFP += fp * w;
        totalWeight += w;
        perMatchFP.push(fp);
    });

    sortedBowl.forEach((inn, idx) => {
        const fp = calcBowlFP(inn.wickets || 0, inn.runs || 0, inn.overs || 0);
        const w = recencyWeight(idx);
        totalWeightedFP += fp * w;
        totalWeight += w;
    });

    const avgFP = totalWeight > 0 ? totalWeightedFP / totalWeight : 0;

    // Consistency bonus
    let consistencyBonus = 0;
    if (perMatchFP.length >= 3) {
        const aboveThreshold = perMatchFP.filter(fp => fp >= 25).length;
        const ratio = aboveThreshold / perMatchFP.length;
        if (ratio >= 0.7) {
            consistencyBonus = 10;
            reasoning.push(`Consistent: ${(ratio * 100).toFixed(0)}% matches ≥25 FP`);
        } else if (ratio >= 0.5) {
            consistencyBonus = 5;
            reasoning.push(`Moderate consistency: ${(ratio * 100).toFixed(0)}% ≥25 FP`);
        }
    }

    // Display stats
    const batInningsCount = batInns.length;
    const avgRuns = batInningsCount > 0 ? batInns.reduce((s: number, i: any) => s + (i.runs || 0), 0) / batInningsCount : 0;
    const avgSR = batInningsCount > 0 ? batInns.reduce((s: number, i: any) => s + (i.strike_rate || 0), 0) / batInningsCount : 0;
    const totalBalls = batInns.reduce((s: number, i: any) => s + (i.balls || 0), 0);
    const totalBoundaries = batInns.reduce((s: number, i: any) => s + (i.fours || 0) + (i.sixes || 0), 0);
    const boundaryPct = totalBalls > 0 ? (totalBoundaries / totalBalls) * 100 : 0;

    const bowlInningsCount = bowlInns.length;
    const avgWickets = bowlInningsCount > 0 ? bowlInns.reduce((s: number, i: any) => s + (i.wickets || 0), 0) / bowlInningsCount : 0;
    const avgEco = bowlInningsCount > 0 ? bowlInns.reduce((s: number, i: any) => s + (i.economy || 0), 0) / bowlInningsCount : 0;
    const totalDots = bowlInns.reduce((s: number, i: any) => s + (i.dots || 0), 0);
    const totalBowlBalls = bowlInns.reduce((s: number, i: any) => s + (i.balls_bowled || 0), 0);
    const dotPct = totalBowlBalls > 0 ? (totalDots / totalBowlBalls) * 100 : 0;

    // Normalize FP to 0–100 (T20 D11 typical range: ~10–80 FP)
    let score = normalize(avgFP + consistencyBonus, 5, 80);

    if (batInningsCount === 0 && bowlInningsCount === 0) {
        score = 25;
        reasoning.push('No tournament data — low default');
    } else {
        reasoning.push(`Predicted FP: ${avgFP.toFixed(1)} (recency-weighted). ${batInningsCount} bat + ${bowlInningsCount} bowl innings`);
    }

    // Match-by-match entries
    const matchByMatch: MatchByMatchEntry[] = [];
    const seenMatches = new Set<string>();
    sortedBat.forEach(inn => {
        if (!seenMatches.has(inn.match_id)) {
            seenMatches.add(inn.match_id);
            const bowlInn = bowlInns.find((b: any) => b.match_id === inn.match_id);
            matchByMatch.push({
                matchId: inn.match_id, date: inn.match_date || '',
                runs: inn.runs, balls: inn.balls, sr: inn.strike_rate,
                fours: inn.fours, sixes: inn.sixes,
                wickets: bowlInn?.wickets, eco: bowlInn?.economy,
                bowlingRuns: bowlInn?.runs, overs: bowlInn?.overs,
            });
        }
    });
    sortedBowl.forEach(inn => {
        if (!seenMatches.has(inn.match_id)) {
            seenMatches.add(inn.match_id);
            matchByMatch.push({
                matchId: inn.match_id, date: inn.match_date || '',
                wickets: inn.wickets, eco: inn.economy,
                bowlingRuns: inn.runs, overs: inn.overs,
            });
        }
    });

    return {
        score: Math.round(Math.min(100, score)),
        batting: { innings: batInningsCount, avgRuns: +avgRuns.toFixed(1), avgSR: +avgSR.toFixed(1), boundaryPct: +boundaryPct.toFixed(1) },
        bowling: { innings: bowlInningsCount, avgWickets: +avgWickets.toFixed(1), avgEco: +avgEco.toFixed(1), dotPct: +dotPct.toFixed(1) },
        matchByMatch,
        reasoning: reasoning.join('. '),
    };
}

function scoreCareerStats(player: any): CareerStatsBreakdown {
    const batting = player.Batting || {};
    const bowling = player.Bowling || {};

    const battingAvg = parseFloat(batting.Average) || 0;
    const battingSR = parseFloat(batting.Strikerate) || 0;
    const totalRuns = parseInt(batting.Runs) || 0;
    const bowlingEco = parseFloat(bowling.Economyrate) || 0;
    const totalWickets = parseInt(bowling.Wickets) || 0;
    const matches = parseInt(player.Matches) || 0;

    // Tighter T20I normalization ranges
    const batScore = normalize(battingAvg, 15, 40) * 0.30
        + normalize(battingSR, 100, 155) * 0.35
        + normalize(totalRuns, 100, 3000) * 0.20
        + normalize(matches, 10, 80) * 0.15;

    const bowlScore = bowlingEco > 0
        ? normalize(9 - bowlingEco, 0, 3) * 0.45
        + normalize(totalWickets, 5, 100) * 0.35
        + normalize(matches, 10, 80) * 0.20
        : 0;

    let score: number;
    const reasoning: string[] = [];

    if (totalWickets > 10 && totalRuns > 100) {
        score = batScore * 0.5 + bowlScore * 0.5;
        reasoning.push(`Career AR: avg ${battingAvg}, SR ${battingSR}, eco ${bowlingEco}, ${totalWickets}w in ${matches}m`);
    } else if (totalWickets > 10) {
        score = batScore * 0.2 + bowlScore * 0.8;
        reasoning.push(`Career bowler: eco ${bowlingEco}, ${totalWickets}w, avg ${battingAvg} in ${matches}m`);
    } else {
        score = batScore * 0.85 + bowlScore * 0.15;
        reasoning.push(`Career batter: avg ${battingAvg}, SR ${battingSR}, ${totalRuns}r in ${matches}m`);
    }

    return {
        score: Math.round(Math.min(100, score)),
        battingAvg, battingSR, totalRuns,
        bowlingEco, totalWickets, matches,
        reasoning: reasoning.join('. '),
    };
}

function scoreICCRanking(
    playerId: string,
    h2hData: any,
    teamId: string,
    careerScore: number
): ICCRankingBreakdown {
    let rank: number | null = null;
    const reasoning: string[] = [];
    let score = 40;

    let teamRank: number | null = null;
    if (h2hData?.team?.head_to_head?.comp_type?.data) {
        const teamData = h2hData.team.head_to_head.comp_type.data.find(
            (t: any) => String(t.id) === String(teamId)
        );
        if (teamData?.icc_ranking) {
            teamRank = teamData.icc_ranking;
            score = Math.max(30, Math.min(85, 85 - (teamData.icc_ranking - 1) * 5));
            reasoning.push(`Team ICC T20I rank #${teamRank} → base ${score}`);
        }
    }

    const careerBonus = ((careerScore - 50) / 50) * 15;
    score = Math.round(Math.max(10, Math.min(100, score + careerBonus)));
    reasoning.push(`Career diff: ${careerBonus > 0 ? '+' : ''}${careerBonus.toFixed(0)} (career=${careerScore})`);

    rank = teamRank;
    return { score, rank, reasoning: reasoning.join('. ') };
}

function scoreRoleValue(
    skillName: string,
    role: string,
    isCaptain: boolean,
    isKeeper: boolean,
    d11Role: D11Role,
    battingPosition?: number
): RoleValueBreakdown {
    let multiplier = 1.0;
    const reasoning: string[] = [];

    if (d11Role === 'AR') {
        multiplier = 1.25;
        reasoning.push('All-rounder: 1.25× (multi-point source)');
    } else if (d11Role === 'WK') {
        multiplier = 1.15;
        reasoning.push('WK-Batter: 1.15× (catches + stumpings + batting)');
    } else if (d11Role === 'BAT') {
        multiplier = 1.0;
        reasoning.push('Pure batter: 1.0×');
    } else {
        multiplier = 1.05;
        reasoning.push('Pure bowler: 1.05×');
    }

    // Batting position value
    if (battingPosition && battingPosition <= 3) {
        multiplier *= 1.10;
        reasoning.push(`Top-order #${battingPosition} (+10% — more balls faced)`);
    } else if (battingPosition && battingPosition <= 5) {
        multiplier *= 1.03;
        reasoning.push(`Middle-order #${battingPosition} (+3%)`);
    }

    if (isCaptain) {
        multiplier *= 1.05;
        reasoning.push('Team captain (+5%)');
    }

    const score = Math.min(100, Math.round(70 * multiplier));

    return {
        score, role: d11Role, skillName: skillName || role || 'Unknown',
        multiplier, isCaptain, isKeeper,
        reasoning: reasoning.join('. '),
    };
}

function scorePitchFit(
    role: D11Role, battingStyle: string, bowlingStyle: string,
    pitchType: string, avgSpeed?: number, battingPosition?: number
): PitchFitBreakdown {
    const pitch = (pitchType || '').toLowerCase();
    const reasoning: string[] = [];
    let score = 50;

    let playerType = 'batter';
    const bowlStyleLower = (bowlingStyle || '').toLowerCase();
    const isSpin = bowlStyleLower.match(/spin|slow|off|leg|orthodox|left.arm.un/);
    if (role === 'BOWL') {
        if (isSpin) playerType = 'spin-bowler';
        else if (avgSpeed && avgSpeed > 125) playerType = 'pace-bowler';
        else if (avgSpeed && avgSpeed < 110) playerType = 'spin-bowler';
        else playerType = 'pace-bowler';
    } else if (role === 'AR') {
        playerType = 'all-rounder';
    } else if (battingPosition && battingPosition <= 3) {
        playerType = 'top-order-bat';
    } else {
        playerType = 'power-hitter';
    }

    if (pitch.includes('bat') || pitch.includes('flat')) {
        if (playerType.includes('bat') || playerType === 'power-hitter') { score = 75; reasoning.push('Batting pitch → batters boosted'); }
        else if (playerType === 'pace-bowler') { score = 35; reasoning.push('Batting pitch → pacers suppressed'); }
        else if (playerType === 'spin-bowler') { score = 40; reasoning.push('Batting pitch → spinners suppressed'); }
        else { score = 60; reasoning.push('Batting pitch → AR slightly boosted'); }
    } else if (pitch.includes('bowl') || pitch.includes('seam') || pitch.includes('pace')) {
        if (playerType === 'pace-bowler') { score = 80; reasoning.push('Seaming pitch → pacers boosted'); }
        else if (playerType === 'top-order-bat') { score = 40; reasoning.push('Seaming → top-order risk'); }
        else if (playerType === 'spin-bowler') { score = 45; reasoning.push('Seaming → spinners neutral'); }
        else { score = 50; reasoning.push('Seaming → neutral'); }
    } else if (pitch.includes('spin') || pitch.includes('turn')) {
        if (playerType === 'spin-bowler') { score = 85; reasoning.push('Spin pitch → spinners boosted'); }
        else if (playerType === 'pace-bowler') { score = 35; reasoning.push('Spin pitch → pacers suppressed'); }
        else if (playerType === 'power-hitter') { score = 55; reasoning.push('Spin → six-hitters slight boost'); }
        else { score = 45; reasoning.push('Spin → batting risk'); }
    } else {
        reasoning.push('Unknown/balanced pitch — neutral');
    }

    return { score: Math.round(score), pitchType: pitchType || 'Unknown', playerType, avgSpeed, reasoning: reasoning.join('. ') };
}

// ============ TEAM BUILDER ============

function buildTeam(allPlayers: PlayerScore[], logs: string[]): { selected: PlayerScore[]; captain: PlayerScore; viceCaptain: PlayerScore; backups: PlayerScore[] } {
    const sorted = [...allPlayers].sort((a, b) => b.totalScore - a.totalScore);

    // Smart bowler minimum: need 2 bowlers UNLESS we have high-wicket ARs
    const highWicketARs = sorted.filter(p =>
        p.role === 'AR' && p.tournamentForm.bowling.avgWickets >= 1.5
    );
    const bowlMin = highWicketARs.length >= 2 ? 1 : 2;
    logs.push(`Bowler strategy: ${highWicketARs.length} high-wicket ARs (≥1.5 avg wkts) → min ${bowlMin} BOWL`);

    const roleLimits: Record<D11Role, { min: number; max: number }> = {
        WK: { min: 1, max: 4 }, BAT: { min: 1, max: 4 },
        AR: { min: 1, max: 4 }, BOWL: { min: bowlMin, max: 4 },
    };

    const teamCounts: Record<string, number> = {};
    const roleCounts: Record<D11Role, number> = { WK: 0, BAT: 0, AR: 0, BOWL: 0 };
    const selected: PlayerScore[] = [];

    logs.push('--- Team Building ---');

    // Phase 1: Fill minimums
    for (const role of ['WK', 'BAT', 'AR', 'BOWL'] as D11Role[]) {
        const candidates = sorted.filter(p =>
            p.role === role && !selected.includes(p) && (teamCounts[p.teamId] || 0) < 7
        );
        const needed = roleLimits[role].min;
        for (let i = 0; i < needed && i < candidates.length; i++) {
            selected.push(candidates[i]);
            roleCounts[role]++;
            teamCounts[candidates[i].teamId] = (teamCounts[candidates[i].teamId] || 0) + 1;
            logs.push(`Min fill ${role}: ${candidates[i].name} (${candidates[i].totalScore.toFixed(1)})`);
        }
    }

    // Phase 2: Greedy fill
    const remaining = sorted.filter(p => !selected.includes(p));
    for (const player of remaining) {
        if (selected.length >= 11) break;
        if (roleCounts[player.role] >= roleLimits[player.role].max) continue;
        if ((teamCounts[player.teamId] || 0) >= 7) continue;

        selected.push(player);
        roleCounts[player.role]++;
        teamCounts[player.teamId] = (teamCounts[player.teamId] || 0) + 1;
        logs.push(`Added ${player.role}: ${player.name} (${player.totalScore.toFixed(1)})`);
    }

    // Captain & Vice-Captain: top 2 by score, no team preference
    const selectedSorted = [...selected].sort((a, b) => b.totalScore - a.totalScore);
    const captain = selectedSorted[0];
    const viceCaptain = selectedSorted[1];

    logs.push(`Captain: ${captain.name} (${captain.totalScore.toFixed(1)}) — highest score`);
    logs.push(`Vice-Captain: ${viceCaptain.name} (${viceCaptain.totalScore.toFixed(1)}) — 2nd highest`);
    logs.push(`Composition: WK=${roleCounts.WK}, BAT=${roleCounts.BAT}, AR=${roleCounts.AR}, BOWL=${roleCounts.BOWL}`);
    logs.push(`From ${Object.entries(teamCounts).map(([id, c]) => `team ${id}: ${c}`).join(', ')}`);

    // Pick 4 backups: next best non-selected, in order
    const backups = sorted.filter(p => !selected.includes(p)).slice(0, 4);
    logs.push(`Backups: ${backups.map((b, i) => `${i + 1}. ${b.name} (${b.role}, ${b.totalScore.toFixed(1)})`).join(' | ')}`);

    return { selected, captain, viceCaptain, backups };
}

// ============ MAIN PREDICT ============

export async function predictDream11(gameId: string, excludeMatchId?: string): Promise<Dream11Prediction> {
    const logs: string[] = [];
    logs.push(`Starting prediction for match ${gameId}${excludeMatchId ? ` (excluding ${excludeMatchId} from form)` : ''}`);

    try {
        logs.push('Fetching scorecard and H2H data...');
        const [scorecard, h2hData] = await Promise.all([
            fetchScorecard(gameId), fetchH2H(gameId),
        ]);

        if (!scorecard) throw new Error('No scorecard data available');

        const matchDetail = scorecard.Matchdetail || {};
        const teams = scorecard.Teams || {};
        const venue = matchDetail.Venue?.Name || 'Unknown Venue';
        const pitchType = matchDetail.Venue?.Pitch_Detail?.Pitch_Suited_For || '';
        const seriesId = matchDetail.Series?.Id || '';

        const teamIds = Object.keys(teams);
        const team1Id = teamIds[0] || matchDetail.Team_Home;
        const team2Id = teamIds[1] || matchDetail.Team_Away;
        const team1 = teams[team1Id] || {};
        const team2 = teams[team2Id] || {};

        logs.push(`Match: ${team1.Name_Full || 'Team 1'} vs ${team2.Name_Full || 'Team 2'}`);
        logs.push(`Venue: ${venue}`);
        logs.push(`Pitch: ${pitchType || 'Not specified'}`);
        logs.push(`Series ID: ${seriesId}`);

        // Extract players
        const allRawPlayers: { id: string; data: any; teamId: string; teamName: string; teamShort: string }[] = [];

        for (const [teamId, team] of Object.entries(teams) as [string, any][]) {
            const players = team.Players || {};
            for (const [playerId, playerData] of Object.entries(players) as [string, any][]) {
                if (playerData.Confirm_XI === true || playerData.Confirm_XI === 'true') {
                    allRawPlayers.push({ id: playerId, data: playerData, teamId, teamName: team.Name_Full || '', teamShort: team.Name_Short || '' });
                }
            }
        }

        if (allRawPlayers.length === 0) {
            logs.push('No confirmed XI found — including all squad players');
            for (const [teamId, team] of Object.entries(teams) as [string, any][]) {
                const players = team.Players || {};
                for (const [playerId, playerData] of Object.entries(players) as [string, any][]) {
                    allRawPlayers.push({ id: playerId, data: playerData, teamId, teamName: team.Name_Full || '', teamShort: team.Name_Short || '' });
                }
            }
        }

        logs.push(`Found ${allRawPlayers.length} players (${allRawPlayers.filter(p => p.teamId === team1Id).length} + ${allRawPlayers.filter(p => p.teamId === team2Id).length})`);

        // Fetch tournament form
        const playerIds = allRawPlayers.map(p => p.id);
        logs.push(`Fetching tournament form from Supabase for ${playerIds.length} players (series ${seriesId})...`);

        const [battingMap, bowlingMap] = await Promise.all([
            fetchTournamentBatting(playerIds, seriesId, excludeMatchId),
            fetchTournamentBowling(playerIds, seriesId, excludeMatchId),
        ]);

        logs.push(`Supabase: ${battingMap.size} with batting data, ${bowlingMap.size} with bowling data`);

        // Score each player
        logs.push('Scoring all players (v2: Fantasy Points + recency decay)...');
        const allPlayers: PlayerScore[] = allRawPlayers.map(rawPlayer => {
            const p = rawPlayer.data;
            const isKeeper = (p.Role || '').toLowerCase().includes('keeper') ||
                (p.Skill_Name || '').toLowerCase().includes('wicket');
            const isCaptain = p.Iscaptain === true;
            const hasConfirmedXI = p.Confirm_XI === true || p.Confirm_XI === 'true';

            const allBatInnings = battingMap.get(rawPlayer.id) || [];
            const bowlInnings = bowlingMap.get(rawPlayer.id) || [];

            // Bug fix #1: Filter out DNB entries (0 balls AND 0 runs = Did Not Bat)
            const batInnings = allBatInnings.filter((inn: any) => inn.balls > 0 || inn.runs > 0);
            const dnbCount = allBatInnings.length - batInnings.length;

            // Bug fix #2: Batting position from Supabase tournament data (avg batting_position)
            const positionsFromData = batInnings
                .map((inn: any) => inn.batting_position)
                .filter((pos: any) => pos && pos > 0);
            const avgBatPos = positionsFromData.length > 0
                ? Math.round(positionsFromData.reduce((s: number, p: number) => s + p, 0) / positionsFromData.length)
                : (hasConfirmedXI ? parseInt(p.Position) || undefined : undefined);

            // Bug fix #3: Role detection uses real innings count (post-DNB filter)
            // Prioritize API Skill_Name for bowlers — if API says "Bowler" and they only have 
            // DNB batting entries, they're BOWL not AR
            const role = mapD11Role(p.Skill_Name || '', p.Role || '', isKeeper, batInnings.length, bowlInnings.length);

            const avgSpeed = bowlInnings.length > 0
                ? bowlInnings.reduce((s: number, i: any) => s + (i.avg_speed || 0), 0) / bowlInnings.filter((i: any) => i.avg_speed > 0).length || undefined
                : undefined;

            // Score each signal — pass filtered batInnings (no DNB)
            const tournamentForm = scoreTournamentForm(rawPlayer.id, batInnings, bowlInnings, role);
            const careerStats = scoreCareerStats(p);
            const iccRanking = scoreICCRanking(rawPlayer.id, h2hData, rawPlayer.teamId, careerStats.score);
            const roleValue = scoreRoleValue(p.Skill_Name || '', p.Role || '', isCaptain, isKeeper, role, avgBatPos);
            const pitchFit = scorePitchFit(role, p.Batting?.Style || '', p.Bowling?.Style || '', pitchType, avgSpeed, avgBatPos);

            const totalScore =
                tournamentForm.score * WEIGHTS.TOURNAMENT_FORM +
                careerStats.score * WEIGHTS.CAREER_STATS +
                iccRanking.score * WEIGHTS.ICC_RANKING +
                roleValue.score * WEIGHTS.ROLE_VALUE +
                pitchFit.score * WEIGHTS.PITCH_FIT;

            // ---- DETAILED LOGGING ----
            logs.push(`\n━━━ ${p.Name_Full || rawPlayer.id} (${role}, ${rawPlayer.teamName}) ━━━`);
            logs.push(`  Skill: ${p.Skill_Name || '?'} | API Role: ${p.Role || '?'} | Avg Bat Pos: ${avgBatPos || '?'} | Capt: ${isCaptain}${dnbCount > 0 ? ` | ${dnbCount} DNB filtered` : ''}`);

            // Tournament Form detail
            logs.push(`  📊 FORM (score=${tournamentForm.score}, weight=${WEIGHTS.TOURNAMENT_FORM}):`);
            if (batInnings.length > 0) {
                const sortedBat = [...batInnings].sort((a: any, b: any) =>
                    new Date(b.match_date || 0).getTime() - new Date(a.match_date || 0).getTime()
                );
                sortedBat.forEach((inn: any, idx: number) => {
                    const fp = calcBatFP(inn.runs || 0, inn.balls || 0, inn.fours || 0, inn.sixes || 0);
                    const w = recencyWeight(idx);
                    logs.push(`    Bat #${idx + 1}: ${inn.runs || 0}(${inn.balls || 0}) SR=${inn.strike_rate?.toFixed(1) || '?'} 4s=${inn.fours || 0} 6s=${inn.sixes || 0} → FP=${fp} × w=${w.toFixed(2)} = ${(fp * w).toFixed(1)}`);
                });
            }
            if (bowlInnings.length > 0) {
                const sortedBowl = [...bowlInnings].sort((a: any, b: any) =>
                    new Date(b.match_date || 0).getTime() - new Date(a.match_date || 0).getTime()
                );
                sortedBowl.forEach((inn: any, idx: number) => {
                    const fp = calcBowlFP(inn.wickets || 0, inn.runs || 0, inn.overs || 0);
                    const w = recencyWeight(idx);
                    logs.push(`    Bowl #${idx + 1}: ${inn.wickets || 0}/${inn.runs || 0} in ${inn.overs || 0}ov eco=${inn.economy?.toFixed(1) || '?'} → FP=${fp} × w=${w.toFixed(2)} = ${(fp * w).toFixed(1)}`);
                });
            }
            logs.push(`    ${tournamentForm.reasoning}`);

            // Career detail
            logs.push(`  📈 CAREER (score=${careerStats.score}): ${careerStats.reasoning}`);

            // ICC detail
            logs.push(`  🏆 ICC (score=${iccRanking.score}): ${iccRanking.reasoning}`);

            // Role detail
            logs.push(`  🎯 ROLE (score=${roleValue.score}): ${roleValue.reasoning}`);

            // Pitch detail
            logs.push(`  🏟️ PITCH (score=${pitchFit.score}): ${pitchFit.reasoning}`);

            // Final formula
            logs.push(`  ── TOTAL: ${tournamentForm.score}×${WEIGHTS.TOURNAMENT_FORM} + ${careerStats.score}×${WEIGHTS.CAREER_STATS} + ${iccRanking.score}×${WEIGHTS.ICC_RANKING} + ${roleValue.score}×${WEIGHTS.ROLE_VALUE} + ${pitchFit.score}×${WEIGHTS.PITCH_FIT} = ${totalScore.toFixed(1)}`);

            return {
                playerId: rawPlayer.id, name: p.Name_Full || `Player ${rawPlayer.id}`,
                shortName: p.Name_Short || p.Name_Full || rawPlayer.id,
                team: rawPlayer.teamName, teamId: rawPlayer.teamId, role,
                totalScore: +totalScore.toFixed(1),
                selected: false, isCaptain: false, isViceCaptain: false,
                tournamentForm, careerStats, iccRanking, roleValue, pitchFit,
            };
        });

        // Log top 5
        const sorted = [...allPlayers].sort((a, b) => b.totalScore - a.totalScore);
        logs.push('\n═══ TOP 5 BY SCORE ═══');
        sorted.slice(0, 5).forEach((p, i) => {
            logs.push(`${i + 1}. ${p.name} (${p.role}) — ${p.totalScore} [form=${p.tournamentForm.score}, career=${p.careerStats.score}, rank=${p.iccRanking.score}, role=${p.roleValue.score}, pitch=${p.pitchFit.score}]`);
        });

        // Build team
        const { selected, captain, viceCaptain, backups } = buildTeam(allPlayers, logs);

        selected.forEach(p => { p.selected = true; });
        captain.isCaptain = true;
        viceCaptain.isViceCaptain = true;

        logs.push(`\nPrediction complete! Selected ${selected.length} players + ${backups.length} backups.`);

        return {
            matchId: gameId,
            team1: { name: team1.Name_Full || 'Team 1', id: team1Id, shortName: team1.Name_Short || '' },
            team2: { name: team2.Name_Full || 'Team 2', id: team2Id, shortName: team2.Name_Short || '' },
            venue, pitchType: pitchType || 'Unknown', seriesId,
            selectedTeam: selected, backups, captain, viceCaptain,
            allPlayers: sorted, logs, loading: false,
        };
    } catch (error: any) {
        logs.push(`ERROR: ${error.message}`);
        return {
            matchId: gameId,
            team1: { name: '', id: '', shortName: '' },
            team2: { name: '', id: '', shortName: '' },
            venue: '', pitchType: '', seriesId: '',
            selectedTeam: [], backups: [], captain: {} as PlayerScore, viceCaptain: {} as PlayerScore,
            allPlayers: [], logs, loading: false, error: error.message,
        };
    }
}
