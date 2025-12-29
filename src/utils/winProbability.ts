
interface TeamInfo {
    id: string;
    name: string;
    short_name: string;
    icc_ranking?: string;
    is_international?: string | boolean;
    nationality?: string;
}

export interface WinProbabilityResult {
    team1: { name: string; probability: number };
    team2: { name: string; probability: number };
    factors?: WinProbabilityFactors;
    phase?: 'pre-match' | 'early' | 'mid' | 'death';
    message?: string;
    details?: WinProbabilityDetails;
}

export interface WinProbabilityDetails {
    projectedScore?: number;
    parScore?: number;
    rrr?: number;
    crr?: number;
    runsNeeded?: number;
    ballsRemaining?: number;
}

export interface WinProbabilityFactors {
    ranking?: number;
    h2h?: number;
    form?: number;
    venue?: number;
    pitch?: number;
    home?: number;
    pedigree?: number;
}

// Weights config
const WEIGHTS = {
    INTERNATIONAL: {
        RANKING: 0.20,
        H2H: 0.20,
        FORM: 0.15,
        VENUE: 0.10,
        PITCH: 0.15,
        HOME: 0.10,
    },
    FRANCHISE: {
        H2H: 0.25,
        FORM: 0.25,
        VENUE: 0.15,
        PITCH: 0.15,
        HOME: 0.10,
        PEDIGREE: 0.10,
    }
};

const getHomeAdvantage = (team: TeamInfo, venueName: string): boolean => {
    if (!venueName || !team) return false;

    // Check nationality for international
    if (team.is_international === 'true' || team.is_international === true || team.is_international === "1") {
        return venueName.includes(team.nationality || '');
    }

    // Check city name in team name vs venue (e.g., "Mumbai" in "Wankhede, Mumbai")
    const city = team.name.split(' ').find(word =>
        ['Mumbai', 'Chennai', 'Bangalore', 'Bengaluru', 'Kolkata', 'Delhi', 'Hyderabad', 'Jaipur', 'Lucknow', 'Ahmedabad', 'Punjab', 'Mohali'].includes(word)
    );
    if (city && venueName.includes(city)) return true;

    return false;
};

const getPitchImpact = (pitchDetail: any, team1Ranking: number, team2Ranking: number): number => {
    // Returns % shift for Team 1
    if (!pitchDetail?.Pitch_Suited_For) return 0;
    const type = pitchDetail.Pitch_Suited_For.toLowerCase();

    // Simple mock logic:
    // If "Batting friendly", favor the higher ranked team (assuming better batting)
    // If "Bowling friendly", favor the higher ranked team (assuming better bowling)
    // For now, allow a small random factor or bias based on strength difference

    const diff = team2Ranking - team1Ranking; // +ve if Team 1 better
    if (type.includes('batting')) return diff * 0.5;
    if (type.includes('bowling')) return diff * 0.5;

    return 0;
};

// ============================================================
// ENHANCED LIVE FACTORS - Helper Functions
// ============================================================

/**
 * Get current partnership momentum
 * Returns adjustment for batting team probability
 */
const getPartnershipMomentum = (partnerships: any[], wickets: number): { adjustment: number; runs: number; balls: number } => {
    if (!partnerships || partnerships.length === 0) return { adjustment: 0, runs: 0, balls: 0 };

    // Current partnership is the one after the last wicket
    const currentPartnership = partnerships.find((p: any) => parseInt(p.ForWicket) === wickets + 1);
    if (!currentPartnership) return { adjustment: 0, runs: 0, balls: 0 };

    const partnershipRuns = parseInt(currentPartnership.Runs || "0");
    const partnershipBalls = parseInt(currentPartnership.Balls || "0");

    let adjustment = 0;
    if (partnershipRuns >= 100) adjustment = 15;        // Century stand - huge momentum
    else if (partnershipRuns >= 50) adjustment = 10;    // 50+ stand - strong momentum
    else if (partnershipRuns >= 30) adjustment = 5;     // Decent partnership
    else if (partnershipBalls < 10 && partnershipRuns < 5) adjustment = -5; // Fresh batter, under pressure

    return { adjustment, runs: partnershipRuns, balls: partnershipBalls };
};

/**
 * Analyze bowlers: quota, quality, pitch synergy
 */
const analyzeBowlers = (bowlers: any[], pitchType: string, format: 'T20' | 'ODI' | 'Test'): {
    starBowlersExhausted: number;
    spinBoost: number;
    paceBoost: number;
    logDetails: string[];
} => {
    if (!bowlers || bowlers.length === 0) {
        return { starBowlersExhausted: 0, spinBoost: 0, paceBoost: 0, logDetails: ['No bowler data'] };
    }

    const maxOvers = format === 'T20' ? 4 : (format === 'ODI' ? 10 : 999);
    const logDetails: string[] = [];
    let starBowlersExhausted = 0;
    let spinBoost = 0;
    let paceBoost = 0;

    const pitchLower = (pitchType || '').toLowerCase();
    const isSpinPitch = pitchLower.includes('spin') || pitchLower.includes('turn');
    const isPacePitch = pitchLower.includes('pace') || pitchLower.includes('seam') || pitchLower.includes('bowling');

    for (const bowler of bowlers) {
        const overs = parseFloat(bowler.Overs || "0");
        const economy = parseFloat(bowler.Economyrate || "8");
        const avgSpeed = parseFloat(bowler.Avg_Speed || "120");
        const isSpinner = avgSpeed < 100;
        const isPacer = avgSpeed > 120;

        const oversLeft = Math.max(0, maxOvers - overs);
        const isExhausted = oversLeft === 0;
        const isEconomical = economy < 7;

        // Check if star bowler (low economy) is exhausted
        if (isExhausted && isEconomical) {
            starBowlersExhausted++;
            logDetails.push(`🔴 Bowler #${bowler.Number} (Eco: ${economy.toFixed(2)}) exhausted`);
        }

        // Pitch synergy bonus for remaining bowlers
        if (!isExhausted && isEconomical) {
            if (isSpinner && isSpinPitch) {
                spinBoost += 5;
                logDetails.push(`✨ Spinner #${bowler.Number} on spin pitch (+5%)`);
            }
            if (isPacer && isPacePitch) {
                paceBoost += 5;
                logDetails.push(`💨 Pacer #${bowler.Number} on pace pitch (+5%)`);
            }
        }
    }

    return { starBowlersExhausted, spinBoost, paceBoost, logDetails };
};

/**
 * Calculate dynamic par score based on conditions
 */
const getDynamicParScore = (
    format: 'T20' | 'ODI' | 'Test',
    pitchType: string,
    battingTeamStrength: number, // 1-100 scale
    bowlingTeamStrength: number  // 1-100 scale
): { parScore: number; logDetails: string[] } => {
    const logDetails: string[] = [];

    // Base par scores
    let basePar = format === 'T20' ? 165 : 270;
    logDetails.push(`Base par: ${basePar}`);

    // Pitch adjustment
    const pitchLower = (pitchType || '').toLowerCase();
    let pitchAdj = 0;
    if (pitchLower.includes('batting')) {
        pitchAdj = format === 'T20' ? 15 : 25;
        logDetails.push(`Batting pitch: +${pitchAdj}`);
    } else if (pitchLower.includes('bowling') || pitchLower.includes('spin') || pitchLower.includes('seam')) {
        pitchAdj = format === 'T20' ? -15 : -25;
        logDetails.push(`Bowling pitch: ${pitchAdj}`);
    }

    // Team strength differential (batting - bowling)
    // Scale: 50 = average, 70 = strong, 30 = weak
    const strengthDiff = (battingTeamStrength - bowlingTeamStrength) / 5;
    logDetails.push(`Strength diff: ${strengthDiff > 0 ? '+' : ''}${strengthDiff.toFixed(0)}`);

    const parScore = Math.round(basePar + pitchAdj + strengthDiff);

    // Clamp to reasonable values
    const minPar = format === 'T20' ? 130 : 200;
    const maxPar = format === 'T20' ? 210 : 350;
    const clampedPar = Math.max(minPar, Math.min(maxPar, parScore));

    return { parScore: clampedPar, logDetails };
};

/**
 * Calculate team strength from H2H player data
 * Returns a 1-100 score where 50 is average, 70+ is strong, 30- is weak
 */
export const getTeamStrengthFromH2H = (
    h2hPlayerData: any,
    teamId: string
): { battingStrength: number; bowlingStrength: number; logDetails: string[] } => {
    const logDetails: string[] = [];
    let battingStrength = 50;
    let bowlingStrength = 50;

    if (!h2hPlayerData?.player?.head_to_head?.comp_type?.teams) {
        logDetails.push('No player H2H data available');
        return { battingStrength, bowlingStrength, logDetails };
    }

    const teams = h2hPlayerData.player.head_to_head.comp_type.teams;
    const teamData = teams.find((t: any) => String(t.id) === String(teamId));

    if (!teamData?.top_players) {
        logDetails.push(`No player data for team ${teamId}`);
        return { battingStrength, bowlingStrength, logDetails };
    }

    // Calculate batting strength from top batsmen ICC rankings
    const batsmen = teamData.top_players.batsmen?.player || [];
    if (batsmen.length > 0) {
        const avgBatRanking = batsmen.reduce((sum: number, p: any) => sum + (p.icc_ranking || 100), 0) / batsmen.length;
        // Convert ranking to strength: Rank 1 = 90 strength, Rank 50 = 60 strength, Rank 100 = 40 strength
        battingStrength = Math.max(30, Math.min(90, 90 - (avgBatRanking * 0.5)));
        logDetails.push(`Batting: avg ICC rank ${avgBatRanking.toFixed(0)} → strength ${battingStrength.toFixed(0)}`);
    }

    // Calculate bowling strength from top bowlers ICC rankings
    const bowlers = teamData.top_players.bowler?.player || [];
    if (bowlers.length > 0) {
        const avgBowlRanking = bowlers.reduce((sum: number, p: any) => sum + (p.icc_ranking || 100), 0) / bowlers.length;
        bowlingStrength = Math.max(30, Math.min(90, 90 - (avgBowlRanking * 0.5)));
        logDetails.push(`Bowling: avg ICC rank ${avgBowlRanking.toFixed(0)} → strength ${bowlingStrength.toFixed(0)}`);
    }

    return { battingStrength, bowlingStrength, logDetails };
};

/**
 * Calculate Pre-Match Win Probability
 */
export const calculatePreMatchProbability = (
    team1: TeamInfo,
    team2: TeamInfo,
    h2hData: any, // Matches played, won, lost
    form1: string[],
    form2: string[],
    venueStats: any,
    pitchDetail: any,
    venueName: string,
    isFranchise: boolean = false,
    homeTeamId?: string,
    h2hPlayerData?: any // Full H2H data for player-level analysis
): WinProbabilityResult => {

    const t1Name = team1.name || team1.short_name;
    const t2Name = team2.name || team2.short_name;

    console.log(`\n🏏 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 WIN PROBABILITY CALCULATION: ${t1Name} vs ${t2Name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🏟️ Venue: ${venueName || '[Unknown Venue]'}`);
    console.log(`🎯 Match Type: ${isFranchise ? 'Franchise/Domestic' : 'International'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Calculate team strengths from H2H player data
    const team1Strength = getTeamStrengthFromH2H(h2hPlayerData, team1.id);
    const team2Strength = getTeamStrengthFromH2H(h2hPlayerData, team2.id);

    console.log(`💪 [TEAM STRENGTH]`);
    console.log(`   ${t1Name}:`);
    team1Strength.logDetails.forEach(log => console.log(`      ${log}`));
    console.log(`   ${t2Name}:`);
    team2Strength.logDetails.forEach(log => console.log(`      ${log}`));

    // Team 1 overall = their batting vs opponent bowling, their bowling vs opponent batting
    const team1Overall = (team1Strength.battingStrength + team1Strength.bowlingStrength) / 2;
    const team2Overall = (team2Strength.battingStrength + team2Strength.bowlingStrength) / 2;
    console.log(`   Overall: ${t1Name} ${team1Overall.toFixed(0)} | ${t2Name} ${team2Overall.toFixed(0)}`);

    let prob1 = 50;
    const weights = isFranchise ? WEIGHTS.FRANCHISE : WEIGHTS.INTERNATIONAL;

    console.log(`\n📈 Starting probability at 50-50...`);

    // 1. ICC Ranking / Pedigree
    if (!isFranchise) {
        const rank1 = parseInt(team1.icc_ranking || "10") || 10;
        const rank2 = parseInt(team2.icc_ranking || "10") || 10;

        if (team1.icc_ranking || team2.icc_ranking) {
            const rankDiff = rank2 - rank1;
            const rankImpact = Math.min(25, Math.max(-25, rankDiff * 2.5)) * weights.RANKING!;
            prob1 += rankImpact;
            console.log(`📊 [RANKING] ${t1Name} ranked #${rank1}, ${t2Name} ranked #${rank2}`);
            console.log(`   → Rank difference gives ${t1Name} ${rankImpact > 0 ? '+' : ''}${rankImpact.toFixed(1)}% advantage`);
        } else {
            console.log(`⚠️ [RANKING] No ICC ranking data available - SKIPPED`);
        }
    } else {
        console.log(`ℹ️ [RANKING] Franchise match - ICC rankings not applicable`);
    }

    // 2. Head to Head (Overall)
    if (h2hData && parseInt(h2hData.matches_played) > 0) {
        const played = parseInt(h2hData.matches_played);
        const won1 = parseInt(h2hData.won);
        const winRate1 = (won1 / played) * 100;
        const h2hImpact = (winRate1 - 50) * weights.H2H!;
        prob1 += h2hImpact;
        console.log(`🔄 [HEAD TO HEAD] ${t1Name} has won ${won1} of ${played} matches (${winRate1.toFixed(0)}%)`);
        console.log(`   → H2H record gives ${t1Name} ${h2hImpact > 0 ? '+' : ''}${h2hImpact.toFixed(1)}% advantage`);
    } else {
        console.log(`⚠️ [HEAD TO HEAD] No H2H data available - SKIPPED`);
    }

    // 2b. Venue-Specific H2H (if available)
    if (venueStats && venueStats.team1_matches > 0 && venueStats.team2_matches > 0) {
        const venue1WinPct = venueStats.team1_win_pct || 50;
        const venue2WinPct = venueStats.team2_win_pct || 50;
        const venueDiff = venue1WinPct - venue2WinPct;
        const venueImpact = venueDiff * weights.VENUE!;
        prob1 += venueImpact;
        console.log(`📍 [VENUE H2H] At this venue:`);
        console.log(`   ${t1Name}: ${venueStats.team1_matches} matches, ${venue1WinPct.toFixed(0)}% win rate`);
        console.log(`   ${t2Name}: ${venueStats.team2_matches} matches, ${venue2WinPct.toFixed(0)}% win rate`);
        console.log(`   → Venue record gives ${t1Name} ${venueImpact > 0 ? '+' : ''}${venueImpact.toFixed(1)}% advantage`);
    } else {
        console.log(`⚠️ [VENUE H2H] No venue-specific H2H data - SKIPPED`);
    }

    // 3. Recent Form
    const getFormScore = (form: string[]) => {
        if (!form || form.length === 0) return 50;
        let score = 0;
        form.forEach(res => {
            if (res === 'W') score += 1;
            else if (res === 'L') score += 0;
            else score += 0.5;
        });
        return (score / Math.max(form.length, 1)) * 100;
    };

    if (form1.length > 0 || form2.length > 0) {
        const formScore1 = getFormScore(form1);
        const formScore2 = getFormScore(form2);
        const formDiff = formScore1 - formScore2;
        const formImpact = formDiff * weights.FORM!;
        prob1 += formImpact;
        console.log(`📋 [RECENT FORM] ${t1Name}: ${form1.length > 0 ? form1.join('-') : 'No data'} (${formScore1.toFixed(0)}%)`);
        console.log(`   ${t2Name}: ${form2.length > 0 ? form2.join('-') : 'No data'} (${formScore2.toFixed(0)}%)`);
        console.log(`   → Form gives ${t1Name} ${formImpact > 0 ? '+' : ''}${formImpact.toFixed(1)}% advantage`);
    } else {
        console.log(`⚠️ [RECENT FORM] No form data available for either team - SKIPPED`);
    }

    // 4. Home Advantage
    let home1 = false;
    let home2 = false;

    if (homeTeamId) {
        home1 = team1.id === homeTeamId;
        home2 = team2.id === homeTeamId;
        console.log(`🏠 [HOME ADVANTAGE] Using official home team ID...`);
    } else {
        home1 = getHomeAdvantage(team1, venueName);
        home2 = getHomeAdvantage(team2, venueName);
        console.log(`🏠 [HOME ADVANTAGE] Using venue name matching (fallback)...`);
    }

    if (home1 && !home2) {
        const homeImpact = 100 * weights.HOME!;
        prob1 += homeImpact;
        console.log(`   ✓ ${t1Name} is playing at HOME → +${homeImpact.toFixed(1)}% boost`);
    } else if (!home1 && home2) {
        const homeImpact = 100 * weights.HOME!;
        prob1 -= homeImpact;
        console.log(`   ✓ ${t2Name} is playing at HOME → ${t1Name} gets -${homeImpact.toFixed(1)}%`);
    } else if (!home1 && !home2) {
        console.log(`   → Neutral venue - no home advantage applied`);
    } else {
        console.log(`⚠️ [HOME ADVANTAGE] Could not determine home team - SKIPPED`);
    }

    // 5. Pitch Impact (Minor in pre-match)
    if (pitchDetail?.Pitch_Suited_For) {
        console.log(`🌿 [PITCH] ${pitchDetail.Pitch_Suited_For} pitch - factored in slightly`);
    } else {
        console.log(`⚠️ [PITCH] No pitch data available - SKIPPED`);
    }

    // Clamp
    const rawProb = prob1;
    prob1 = Math.max(15, Math.min(85, prob1));

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ FINAL PROBABILITY (before clamping: ${rawProb.toFixed(1)}%)`);
    console.log(`   🔵 ${t1Name}: ${prob1.toFixed(0)}%`);
    console.log(`   🔴 ${t2Name}: ${(100 - prob1).toFixed(0)}%`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return {
        team1: { name: team1.short_name, probability: prob1 },
        team2: { name: team2.short_name, probability: 100 - prob1 },
        phase: 'pre-match'
    };
};

/**
 * Calculate Live Win Probability
 */
export const calculateLiveProbability = (
    preMatchProb: WinProbabilityResult,
    scorecard: any,
    currentInnings: number,
    format: 'T20' | 'ODI' | 'Test' = 'T20',
    h2hPlayerData?: any, // For team strength calculation
    team1Id?: string,
    team2Id?: string
): WinProbabilityResult => {

    // Default safe return
    if (!scorecard || !scorecard.Innings || scorecard.Innings.length === 0) {
        console.log(`⚠️ [LIVE CALC] No innings data available - returning pre-match probability`);
        return preMatchProb;
    }

    // Identify current innings
    const innings = scorecard.Innings;
    const currentInningIndex = innings.length - 1;
    const currentInning = innings[currentInningIndex];

    const batTeamName = currentInning.Battingteam;
    const isTeam1Batting = preMatchProb.team1.name === batTeamName;
    const battingTeam = isTeam1Batting ? preMatchProb.team1.name : preMatchProb.team2.name;
    const bowlingTeam = isTeam1Batting ? preMatchProb.team2.name : preMatchProb.team1.name;

    // Determine Overs Progress
    const overStr = currentInning.Overs || "0";
    const totalOvers = format === 'T20' ? 20 : (format === 'ODI' ? 50 : 90);
    const oversBowled = parseFloat(overStr);
    const progress = Math.min(1, oversBowled / totalOvers);
    const phase = progress < 0.3 ? 'EARLY' : progress < 0.8 ? 'MID' : 'DEATH';

    // Weight shifts from 0.4 (start) to 0.95 (end)
    const liveWeight = 0.4 + (0.55 * progress);

    console.log(`\n⚡ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📺 LIVE PROBABILITY UPDATE: ${battingTeam} batting`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Innings: ${currentInningIndex + 1} | Format: ${format} | Phase: ${phase}`);
    console.log(`⏱️ Overs: ${overStr}/${totalOvers} (${(progress * 100).toFixed(0)}% complete)`);
    console.log(`⚖️ Blend: ${((1 - liveWeight) * 100).toFixed(0)}% Pre-Match + ${(liveWeight * 100).toFixed(0)}% Live`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    let liveProbBat = 50;

    // Get pitch type for analysis
    const pitchType = scorecard?.Matchdetail?.Venue?.Pitch_Detail?.Pitch_Suited_For || '';

    // Get partnerships for current innings
    const partnerships = currentInning.Partnerships || [];
    const wickets = parseInt(currentInning.Wickets || "0");

    // Get bowler data
    const bowlers = currentInning.Bowlers || [];

    if (currentInningIndex === 0) {
        // 1st Innings: Projected vs Dynamic Par
        const runs = parseInt(currentInning.Total || "0");
        const crr = parseFloat(currentInning.Runrate || "0");
        const oversLeft = Math.max(0, totalOvers - oversBowled);

        const resourceFactor = Math.max(0.1, 1 - (wickets * (wickets > 5 ? 0.12 : 0.08)));
        const projected = Math.floor(runs + (crr * oversLeft * resourceFactor));

        // Dynamic Par Score using actual team strengths from H2H
        const battingTeamId = isTeam1Batting ? team1Id : team2Id;
        const bowlingTeamId = isTeam1Batting ? team2Id : team1Id;
        const battingTeamStrength = getTeamStrengthFromH2H(h2hPlayerData, battingTeamId || '');
        const bowlingTeamStrength = getTeamStrengthFromH2H(h2hPlayerData, bowlingTeamId || '');

        const battingStrength = battingTeamStrength.battingStrength;
        const bowlingStrength = bowlingTeamStrength.bowlingStrength;

        console.log(`📊 [TEAM STRENGTH FOR PAR]`);
        console.log(`   Batting (${battingTeam}): ${battingStrength.toFixed(0)}`);
        console.log(`   Bowling (${bowlingTeam}): ${bowlingStrength.toFixed(0)}`);

        const { parScore, logDetails: parLogDetails } = getDynamicParScore(format, pitchType, battingStrength, bowlingStrength);

        const diff = projected - parScore;
        liveProbBat = 50 + (diff * 0.5);

        console.log(`🏏 [1ST INNINGS] ${battingTeam} setting target`);
        console.log(`   Score: ${runs}/${wickets} in ${overStr} overs (CRR: ${crr.toFixed(2)})`);
        console.log(`   Projected: ${projected} | Dynamic Par: ${parScore}`);
        console.log(`   Par Calculation: ${parLogDetails.join(' | ')}`);
        console.log(`   Resource Factor: ${(resourceFactor * 100).toFixed(0)}% (${wickets} wickets down)`);
        console.log(`   → Base probability: ${liveProbBat.toFixed(0)}%`);

        // Partnership Momentum
        const partnership = getPartnershipMomentum(partnerships, wickets);
        if (partnership.adjustment !== 0) {
            liveProbBat += partnership.adjustment;
            console.log(`🤝 [PARTNERSHIP] ${partnership.runs} runs off ${partnership.balls} balls`);
            console.log(`   → Adjustment: ${partnership.adjustment > 0 ? '+' : ''}${partnership.adjustment}%`);
        }

        // Bowler Analysis (from bowling team's perspective)
        const bowlerAnalysis = analyzeBowlers(bowlers, pitchType, format);
        if (bowlerAnalysis.logDetails.length > 0 && !bowlerAnalysis.logDetails[0].includes('No bowler')) {
            console.log(`🎳 [BOWLER ANALYSIS]`);
            bowlerAnalysis.logDetails.forEach(log => console.log(`   ${log}`));

            // Star bowlers exhausted = good for batting team
            if (bowlerAnalysis.starBowlersExhausted > 0) {
                const exhaustedBonus = bowlerAnalysis.starBowlersExhausted * 5;
                liveProbBat += exhaustedBonus;
                console.log(`   → Batting boost (bowlers exhausted): +${exhaustedBonus}%`);
            }

            // Pitch synergy boosts bowling team (reduces batting prob)
            const pitchSynergyPenalty = bowlerAnalysis.spinBoost + bowlerAnalysis.paceBoost;
            if (pitchSynergyPenalty > 0) {
                liveProbBat -= pitchSynergyPenalty;
                console.log(`   → Bowling boost (pitch synergy): -${pitchSynergyPenalty}%`);
            }
        }

        console.log(`   → Final 1st innings probability: ${liveProbBat.toFixed(0)}%`);

    } else {
        // 2nd Innings: Chase Pressure
        let target = parseInt(currentInning.Target || "0");
        if (!target && innings[0]) target = parseInt(innings[0].Total || "0") + 1;
        if (!target) target = 200;

        const runs = parseInt(currentInning.Total || "0");
        const wickets = parseInt(currentInning.Wickets || "0");

        const ballsBowled = Math.floor(oversBowled) * 6 + Math.round((oversBowled % 1) * 10);
        const ballsLeft = (totalOvers * 6) - ballsBowled;
        const runsNeeded = target - runs;
        const rrr = runsNeeded / (Math.max(1, ballsLeft) / 6);
        const wicketsLeft = 10 - wickets;

        console.log(`🎯 [2ND INNINGS] ${battingTeam} chasing ${target}`);
        console.log(`   Score: ${runs}/${wickets} (Need ${runsNeeded} from ${ballsLeft} balls)`);
        console.log(`   RRR: ${rrr.toFixed(2)} | Wickets in hand: ${wicketsLeft}`);

        if (runs >= target) {
            liveProbBat = 100;
            console.log(`   ✅ Target achieved! ${battingTeam} wins.`);
        } else if (wickets >= 10 || ballsLeft <= 0) {
            liveProbBat = 0;
            console.log(`   ❌ ${battingTeam} ${wickets >= 10 ? 'all out' : 'out of overs'}.`);
        } else {
            // Base Calculation (RRR Pressure)
            if (rrr > 13) liveProbBat = 5;
            else if (rrr > 12) liveProbBat = 10;
            else if (rrr > 10) liveProbBat = 20;
            else if (rrr > 9) liveProbBat = 35;
            else if (rrr > 8) liveProbBat = 45;
            else if (rrr < 6) liveProbBat = 80;
            else liveProbBat = 60;

            console.log(`   Base prob (from RRR): ${liveProbBat.toFixed(0)}%`);

            // Wicket Penalty
            if (wicketsLeft < 3) {
                liveProbBat *= 0.3;
                console.log(`   ⚠️ Danger zone (${wicketsLeft} wickets left) → ×0.3 penalty`);
            } else if (wicketsLeft < 5) {
                liveProbBat *= 0.6;
                console.log(`   ⚠️ Pressure (${wicketsLeft} wickets left) → ×0.6 penalty`);
            }

            // Death overs pressure
            if (ballsLeft < 12 && runsNeeded > 20) {
                liveProbBat *= 0.5;
                console.log(`   💀 Death crunch (${runsNeeded} needed, ${ballsLeft} balls) → ×0.5 penalty`);
            }

            // Partnership Momentum (also applies in 2nd innings)
            const partnership = getPartnershipMomentum(partnerships, wickets);
            if (partnership.adjustment !== 0) {
                liveProbBat += partnership.adjustment;
                console.log(`🤝 [PARTNERSHIP] ${partnership.runs} runs off ${partnership.balls} balls`);
                console.log(`   → Adjustment: ${partnership.adjustment > 0 ? '+' : ''}${partnership.adjustment}%`);
            }

            // Bowler Analysis (bowling team's remaining firepower)
            // In 2nd innings, get bowlers from 2nd innings Bowlers array
            const chaseInningBowlers = currentInning.Bowlers || [];
            const bowlerAnalysis = analyzeBowlers(chaseInningBowlers, pitchType, format);
            if (bowlerAnalysis.logDetails.length > 0 && !bowlerAnalysis.logDetails[0].includes('No bowler')) {
                console.log(`🎳 [BOWLER ANALYSIS]`);
                bowlerAnalysis.logDetails.forEach(log => console.log(`   ${log}`));

                // Star bowlers exhausted = good for chasing team
                if (bowlerAnalysis.starBowlersExhausted > 0) {
                    const exhaustedBonus = bowlerAnalysis.starBowlersExhausted * 5;
                    liveProbBat += exhaustedBonus;
                    console.log(`   → Chasing boost (bowlers exhausted): +${exhaustedBonus}%`);
                }

                // Pitch synergy helps bowling team
                const pitchSynergyPenalty = bowlerAnalysis.spinBoost + bowlerAnalysis.paceBoost;
                if (pitchSynergyPenalty > 0) {
                    liveProbBat -= pitchSynergyPenalty;
                    console.log(`   → Defending boost (pitch synergy): -${pitchSynergyPenalty}%`);
                }
            }

            console.log(`   → Final 2nd innings probability: ${liveProbBat.toFixed(0)}%`);
        }
    }

    // Clamp
    liveProbBat = Math.max(1, Math.min(99, liveProbBat));

    // Blend
    const preMatchBatProb = isTeam1Batting ? preMatchProb.team1.probability : preMatchProb.team2.probability;
    const finalBatProb = (preMatchBatProb * (1 - liveWeight)) + (liveProbBat * liveWeight);
    const finalProb = Math.max(1, Math.min(99, finalBatProb));

    console.log(`\n📈 [BLENDING]`);
    console.log(`   Pre-match ${battingTeam}: ${preMatchBatProb.toFixed(0)}%`);
    console.log(`   Live ${battingTeam}: ${liveProbBat.toFixed(0)}%`);
    console.log(`   Blended: (${preMatchBatProb.toFixed(0)} × ${((1 - liveWeight) * 100).toFixed(0)}%) + (${liveProbBat.toFixed(0)} × ${(liveWeight * 100).toFixed(0)}%) = ${finalBatProb.toFixed(1)}%`);

    // Calculate details for UI
    let details: WinProbabilityDetails = {};
    if (currentInningIndex === 0) {
        const runs = parseInt(currentInning.Total || "0");
        const crr = parseFloat(currentInning.Runrate || "0");
        const wickets = parseInt(currentInning.Wickets || "0");
        const oversLeft = Math.max(0, totalOvers - oversBowled);
        const resourceFactor = Math.max(0.1, 1 - (wickets * (wickets > 5 ? 0.12 : 0.08)));
        const projected = Math.floor(runs + (crr * oversLeft * resourceFactor));
        const parScore = totalOvers === 20 ? 170 : 280;

        details = {
            projectedScore: projected,
            parScore: parScore,
            crr: crr
        };
    } else {
        let target = parseInt(currentInning.Target || "0");
        if (!target && innings[0]) target = parseInt(innings[0].Total || "0") + 1;
        const runs = parseInt(currentInning.Total || "0");
        const runsNeeded = target - runs;
        const ballsBowled = Math.floor(oversBowled) * 6 + Math.round((oversBowled % 1) * 10);
        const ballsLeft = Math.max(0, (totalOvers * 6) - ballsBowled);
        const rrr = runsNeeded / (Math.max(1, ballsLeft) / 6);
        const crr = parseFloat(currentInning.Runrate || "0");

        details = {
            rrr: rrr,
            runsNeeded: runsNeeded,
            ballsRemaining: ballsLeft,
            crr: crr
        };
    }

    const t1Prob = isTeam1Batting ? finalProb : 100 - finalProb;
    const t2Prob = isTeam1Batting ? 100 - finalProb : finalProb;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ LIVE PROBABILITY (${phase} PHASE)`);
    console.log(`   🔵 ${preMatchProb.team1.name}: ${t1Prob.toFixed(0)}%`);
    console.log(`   🔴 ${preMatchProb.team2.name}: ${t2Prob.toFixed(0)}%`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return {
        team1: {
            name: preMatchProb.team1.name,
            probability: t1Prob
        },
        team2: {
            name: preMatchProb.team2.name,
            probability: t2Prob
        },
        phase: progress < 0.3 ? 'early' : progress < 0.8 ? 'mid' : 'death',
        message: currentInningIndex === 0 ? 'Setting Target' : 'Chase On',
        details: details
    };
};
