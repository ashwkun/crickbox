
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
 * Analyze momentum from over-by-over data
 * Returns adjustment for batting team probability based on recent performance
 */
export const getMomentumFromOBO = (
    overByOverData: any,
    currentOver: number,
    format: 'T20' | 'ODI' | 'Test' = 'T20'
): { adjustment: number; logDetails: string[] } => {
    const logDetails: string[] = [];
    let adjustment = 0;

    const overs = overByOverData?.Overbyover;
    if (!overs || overs.length === 0) {
        logDetails.push('No OBO data available');
        return { adjustment, logDetails };
    }

    // Get last 3 overs data
    const recentOvers = overs.slice(-3);
    const recentRuns = recentOvers.reduce((sum: number, o: any) => sum + parseInt(o.Runs || '0'), 0);
    // Fix: Wickets in OBO is a string representing count in that over
    const recentWickets = recentOvers.reduce((sum: number, o: any) => sum + parseInt(o.Wickets || '0'), 0);
    const recentRunRate = recentRuns / recentOvers.length;

    // Calculate match run rate
    const totalRuns = overs.reduce((sum: number, o: any) => sum + parseInt(o.Runs || '0'), 0);
    const matchRunRate = totalRuns / overs.length;

    logDetails.push(`Last ${recentOvers.length} overs: ${recentRuns} runs (${recentRunRate.toFixed(1)} RPO)`);
    logDetails.push(`Match rate: ${matchRunRate.toFixed(1)} RPO`);

    // Momentum based on recent vs match rate
    const rateDiff = recentRunRate - matchRunRate;

    if (rateDiff > 3) {
        adjustment = 10;
        logDetails.push('🔥 SURGING (+10%): Acceleration in recent overs');
    } else if (rateDiff > 1.5) {
        adjustment = 5;
        logDetails.push('📈 Positive momentum (+5%): Above match rate');
    } else if (rateDiff < -3) {
        adjustment = -10;
        logDetails.push('📉 SLOWING (-10%): Significant deceleration');
    } else if (rateDiff < -1.5) {
        adjustment = -5;
        logDetails.push('⬇️ Negative momentum (-5%): Below match rate');
    }

    // Wicket pressure in recent overs
    if (recentWickets >= 2) {
        adjustment -= 10;
        logDetails.push(`⚠️ Wicket pressure (-10%): ${recentWickets} wickets in last 3 overs`);
    } else if (recentWickets === 1) {
        adjustment -= 3;
        logDetails.push(`🎯 Fresh wicket (-3%): 1 wicket in last 3 overs`);
    }

    // Phase-specific bonuses (all formats)
    const totalOvers = format === 'T20' ? 20 : (format === 'ODI' ? 50 : 90);
    const powplayEnd = format === 'T20' ? 6 : (format === 'ODI' ? 10 : 0);
    const deathStart = format === 'T20' ? 16 : (format === 'ODI' ? 40 : 0);
    const ppThreshold = format === 'T20' ? 10 : 7; // Strong PP run rate threshold
    const deathThreshold = format === 'T20' ? 12 : 10;

    if (powplayEnd > 0 && currentOver <= powplayEnd && recentRunRate > ppThreshold) {
        adjustment += 5;
        logDetails.push(`💥 Dominant powerplay (+5%): ${recentRunRate.toFixed(1)} RPO`);
    } else if (deathStart > 0 && currentOver >= deathStart && recentRunRate > deathThreshold) {
        adjustment += 5;
        logDetails.push(`🚀 Death overs acceleration (+5%): ${recentRunRate.toFixed(1)} RPO`);
    }

    return { adjustment, logDetails };
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
 * Get team strength from actual playing XI (scorecard) cross-referenced with H2H ICC rankings
 * Prefers scorecard if both teams have confirmed players, fallback to H2H otherwise
 */
export const getPlayingXIStrength = (
    scorecard: any,
    h2hPlayerData: any,
    teamId: string
): { battingStrength: number; bowlingStrength: number; logDetails: string[] } => {
    const logDetails: string[] = [];
    let battingStrength = 50;
    let bowlingStrength = 50;

    // Get playing XI from scorecard Teams
    const teams = scorecard?.Teams;
    if (!teams) {
        logDetails.push('No scorecard Teams - using H2H fallback');
        return getTeamStrengthFromH2H(h2hPlayerData, teamId);
    }

    // Find the team's players
    const teamEntry = Object.entries(teams).find(([_, t]: [string, any]) =>
        String(t.Team_Id) === String(teamId) || t.Name_Short === teamId
    );

    if (!teamEntry) {
        logDetails.push(`Team ${teamId} not found - using H2H fallback`);
        return getTeamStrengthFromH2H(h2hPlayerData, teamId);
    }

    const teamData: any = teamEntry[1];
    const playersObj = teamData.Players || {};

    // Filter confirmed playing XI
    const playingXI = Object.entries(playersObj)
        .filter(([_, p]: [string, any]) => p.Confirm_XI === true)
        .map(([id, p]: [string, any]) => ({
            id,
            name: p.Name_Full || p.Name_Short,
            role: p.Role || p.Skill_Name,
            battingAvg: parseFloat(p.Batting?.Average || '0'),
            bowlingEco: parseFloat(p.Bowling?.Economyrate || '10')
        }));

    if (playingXI.length === 0) {
        logDetails.push('No confirmed playing XI - using H2H fallback');
        return getTeamStrengthFromH2H(h2hPlayerData, teamId);
    }

    logDetails.push(`Playing XI: ${playingXI.length} players`);

    // Build H2H player lookup (all players from both teams)
    const h2hPlayers: { [key: string]: number } = {};
    if (h2hPlayerData?.player?.head_to_head?.comp_type?.teams) {
        for (const team of h2hPlayerData.player.head_to_head.comp_type.teams) {
            const batsmen = team.top_players?.batsmen?.player || [];
            const bowlers = team.top_players?.bowler?.player || [];
            [...batsmen, ...bowlers].forEach((p: any) => {
                if (p.id) h2hPlayers[String(p.id)] = p.icc_ranking || 100;
                if (p.short_name) h2hPlayers[p.short_name.toLowerCase()] = p.icc_ranking || 100;
            });
        }
    }

    // Match playing XI with H2H rankings
    let totalBatRanking = 0;
    let batCount = 0;
    let totalBowlRanking = 0;
    let bowlCount = 0;

    for (const player of playingXI) {
        // Try to match by ID first, then by name
        let iccRanking = h2hPlayers[player.id] ||
            h2hPlayers[player.name.toLowerCase()] ||
            h2hPlayers[player.name.split(' ').pop()?.toLowerCase() || ''];

        if (!iccRanking && player.battingAvg > 30) {
            // Estimate from batting average if no ranking: avg 50 ≈ rank 10, avg 25 ≈ rank 100
            iccRanking = Math.max(10, 120 - player.battingAvg * 2);
        }

        const isBatter = player.role?.toLowerCase().includes('bat') || player.battingAvg > 25;
        const isBowler = player.role?.toLowerCase().includes('bowl') || player.bowlingEco < 8;

        if (isBatter && iccRanking) {
            totalBatRanking += iccRanking;
            batCount++;
        }
        if (isBowler && iccRanking) {
            totalBowlRanking += iccRanking;
            bowlCount++;
        }
    }

    // Calculate strength from rankings
    if (batCount > 0) {
        const avgBatRanking = totalBatRanking / batCount;
        battingStrength = Math.max(30, Math.min(90, 90 - (avgBatRanking * 0.5)));
        logDetails.push(`Batting: ${batCount} batters, avg rank ${avgBatRanking.toFixed(0)} → ${battingStrength.toFixed(0)}`);
    }
    if (bowlCount > 0) {
        const avgBowlRanking = totalBowlRanking / bowlCount;
        bowlingStrength = Math.max(30, Math.min(90, 90 - (avgBowlRanking * 0.5)));
        logDetails.push(`Bowling: ${bowlCount} bowlers, avg rank ${avgBowlRanking.toFixed(0)} → ${bowlingStrength.toFixed(0)}`);
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
    team2Id?: string,
    overByOverData?: any // For momentum calculation
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

    const batTeamId = currentInning.Battingteam;

    // Robust Team Identification
    // Try to match by ID first, then name fallback
    let isTeam1Batting = false;

    if (team1Id && team2Id) {
        if (String(batTeamId) === String(team1Id)) isTeam1Batting = true;
        else if (String(batTeamId) === String(team2Id)) isTeam1Batting = false;
        else {
            // Fallback to name match if IDs don't match (rare but possible in bad data)
            isTeam1Batting = preMatchProb.team1.name === batTeamId;
        }
    } else {
        // Legacy fallback
        isTeam1Batting = preMatchProb.team1.name === batTeamId;
    }

    const battingTeam = isTeam1Batting ? preMatchProb.team1.name : preMatchProb.team2.name;
    const bowlingTeam = isTeam1Batting ? preMatchProb.team2.name : preMatchProb.team1.name;

    // Determine Overs Progress
    const overStr = currentInning.Overs || "0";
    const totalOvers = format === 'T20' ? 20 : (format === 'ODI' ? 50 : 90);
    const oversBowled = parseFloat(overStr);
    const progress = Math.min(1, oversBowled / totalOvers);

    // User Request: 1st Innings logic should not be "DEATH". Treat as MID.
    // DEATH phase reserved for 2nd innings (chasing pressure)
    let phase = progress < 0.3 ? 'EARLY' : 'MID';
    if (currentInnings === 2 && progress >= 0.8) {
        phase = 'DEATH';
    }

    // Weight shifts from 0.4 (start) to 1.0 (death phase = 100% live, 0% pre-match)
    const liveWeight = Math.min(1, 0.4 + (0.6 * progress));

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

    // === VERBOSE INPUT LOGGING ===
    console.log(`📋 [INPUT DATA RECEIVED]`);
    console.log(`   • Pre-Match Prob: ${preMatchProb.team1.name} ${preMatchProb.team1.probability.toFixed(0)}% | ${preMatchProb.team2.name} ${preMatchProb.team2.probability.toFixed(0)}%`);
    console.log(`   • Scorecard: ${scorecard ? '✅ Available' : '❌ Missing'}`);
    console.log(`   • Innings Count: ${innings.length} (viewing #${currentInningIndex + 1})`);
    console.log(`   • Batting Team ID: "${batTeamId}"`);
    console.log(`   • Team 1 ID: "${team1Id}" | Team 2 ID: "${team2Id}"`);
    console.log(`   • Identified Batting Team: ${battingTeam} (isTeam1: ${isTeam1Batting})`);
    console.log(`   • Format: ${format} | Total Overs: ${totalOvers}`);
    console.log(`   • Overs Bowled: ${oversBowled} | Progress: ${(progress * 100).toFixed(1)}% | Phase: ${phase}`);
    console.log(`   • Pitch Type: "${pitchType || 'NOT AVAILABLE'}"`);
    console.log(`   • Partnerships: ${partnerships.length} entries`);
    console.log(`   • Bowlers: ${bowlers.length} entries`);
    console.log(`   • H2H Player Data: ${h2hPlayerData ? '✅ Available' : '❌ Missing'}`);
    console.log(`   • Team IDs: team1="${team1Id || 'MISSING'}" | team2="${team2Id || 'MISSING'}"`);
    console.log(`   • OBO Data: ${overByOverData?.Overbyover ? `✅ ${overByOverData.Overbyover.length} overs` : '❌ Missing'}`);
    console.log(``);

    if (currentInningIndex === 0) {
        // 1st Innings: Projected vs Dynamic Par
        const runs = parseInt(currentInning.Total || "0");
        const crr = parseFloat(currentInning.Runrate || "0");
        const oversLeft = Math.max(0, totalOvers - oversBowled);

        const resourceFactor = Math.max(0.1, 1 - (wickets * (wickets > 5 ? 0.12 : 0.08)));
        const projected = Math.floor(runs + (crr * oversLeft * resourceFactor));

        // Dynamic Par Score using actual playing XI from scorecard, cross-referenced with H2H ICC rankings
        const battingTeamId = isTeam1Batting ? team1Id : team2Id;
        const bowlingTeamId = isTeam1Batting ? team2Id : team1Id;

        // Use getPlayingXIStrength for actual playing 11 (not H2H's top 5)
        const battingTeamStrength = getPlayingXIStrength(scorecard, h2hPlayerData, battingTeamId || '');
        const bowlingTeamStrength = getPlayingXIStrength(scorecard, h2hPlayerData, bowlingTeamId || '');

        const battingStrength = battingTeamStrength.battingStrength;
        const bowlingStrength = bowlingTeamStrength.bowlingStrength;

        console.log(`📊 [PLAYING XI STRENGTH]`);
        console.log(`   ${battingTeam} (batting):`);
        battingTeamStrength.logDetails.forEach(log => console.log(`      ${log}`));
        console.log(`   ${bowlingTeam} (bowling):`);
        bowlingTeamStrength.logDetails.forEach(log => console.log(`      ${log}`));

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
        } else {
            console.log(`🤝 [PARTNERSHIP] ${partnership.runs} runs off ${partnership.balls} balls → No adjustment (below threshold)`);
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
            } else {
                console.log(`   → No pitch synergy (spin: ${bowlerAnalysis.spinBoost}, pace: ${bowlerAnalysis.paceBoost})`);
            }
        } else {
            console.log(`🎳 [BOWLER ANALYSIS] ⏭️ SKIPPED - ${bowlerAnalysis.logDetails[0] || 'No bowler data available'}`);
        }

        // OBO Momentum Analysis
        if (overByOverData) {
            const momentum = getMomentumFromOBO(overByOverData, Math.floor(oversBowled), format);
            if (momentum.adjustment !== 0) {
                liveProbBat += momentum.adjustment;
                console.log(`📈 [MOMENTUM]`);
                momentum.logDetails.forEach(log => console.log(`   ${log}`));
                console.log(`   → Adjustment: ${momentum.adjustment > 0 ? '+' : ''}${momentum.adjustment}%`);
            } else {
                console.log(`📈 [MOMENTUM] ⏭️ No adjustment - ${momentum.logDetails.join(' | ')}`);
            }
        } else {
            console.log(`📈 [MOMENTUM] ⏭️ SKIPPED - No OBO data available`);
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
            // Base Calculation (RRR Pressure) - Format-aware thresholds
            // T20: RRR 13+ is near impossible, ODI: 8+ is very hard, Test: 5+ is high
            const rrrImpossible = format === 'T20' ? 13 : (format === 'ODI' ? 9 : 6);
            const rrrVeryHard = format === 'T20' ? 12 : (format === 'ODI' ? 8 : 5);
            const rrrHard = format === 'T20' ? 10 : (format === 'ODI' ? 7 : 4.5);
            const rrrDifficult = format === 'T20' ? 9 : (format === 'ODI' ? 6.5 : 4);
            const rrrChallenging = format === 'T20' ? 8 : (format === 'ODI' ? 6 : 3.5);
            const rrrEasy = format === 'T20' ? 6 : (format === 'ODI' ? 4 : 2.5);

            if (rrr > rrrImpossible) liveProbBat = 5;
            else if (rrr > rrrVeryHard) liveProbBat = 10;
            else if (rrr > rrrHard) liveProbBat = 20;
            else if (rrr > rrrDifficult) liveProbBat = 35;
            else if (rrr > rrrChallenging) liveProbBat = 45;
            else if (rrr < rrrEasy) liveProbBat = 80;
            else liveProbBat = 60;

            console.log(`   Base prob (from RRR ${rrr.toFixed(1)}, ${format} thresholds): ${liveProbBat.toFixed(0)}%`);

            // Wicket Penalty - Harsher in death
            if (wicketsLeft < 3) {
                liveProbBat *= 0.2;
                console.log(`   ⚠️ DANGER ZONE (${wicketsLeft} wickets left) → ×0.2 penalty`);
            } else if (wicketsLeft < 5) {
                liveProbBat *= 0.5;
                console.log(`   ⚠️ Pressure (${wicketsLeft} wickets left) → ×0.5 penalty`);
            } else if (wicketsLeft < 7) {
                liveProbBat *= 0.8;
                console.log(`   ⚠️ Minor pressure (${wicketsLeft} wickets left) → ×0.8 penalty`);
            }

            // Death overs pressure - Much harsher and granular
            const isDeathPhase = format === 'T20' ? ballsLeft <= 30 : (format === 'ODI' ? ballsLeft <= 60 : false);
            if (isDeathPhase) {
                const runsPerBallNeeded = runsNeeded / Math.max(1, ballsLeft);
                console.log(`   💀 [DEATH ANALYSIS] ${runsNeeded} from ${ballsLeft} balls (${runsPerBallNeeded.toFixed(2)} RPB)`);

                if (runsPerBallNeeded > 2.5) {
                    liveProbBat *= 0.1;
                    console.log(`      → VIRTUALLY IMPOSSIBLE (>2.5 RPB) → ×0.1`);
                } else if (runsPerBallNeeded > 2) {
                    liveProbBat *= 0.2;
                    console.log(`      → Near impossible (>2 RPB) → ×0.2`);
                } else if (runsPerBallNeeded > 1.5) {
                    liveProbBat *= 0.4;
                    console.log(`      → Very hard (>1.5 RPB) → ×0.4`);
                } else if (runsPerBallNeeded > 1.2) {
                    liveProbBat *= 0.6;
                    console.log(`      → Difficult (>1.2 RPB) → ×0.6`);
                } else if (runsPerBallNeeded > 1) {
                    liveProbBat *= 0.8;
                    console.log(`      → Challenging (>1 RPB) → ×0.8`);
                } else if (runsPerBallNeeded < 0.5) {
                    liveProbBat = Math.min(95, liveProbBat * 1.3);
                    console.log(`      → Easy chase (<0.5 RPB) → ×1.3 boost`);
                }
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

            // OBO Momentum Analysis (also applies in 2nd innings)
            if (overByOverData) {
                const momentum = getMomentumFromOBO(overByOverData, Math.floor(oversBowled), format);
                if (momentum.adjustment !== 0) {
                    liveProbBat += momentum.adjustment;
                    console.log(`📈 [MOMENTUM]`);
                    momentum.logDetails.forEach(log => console.log(`   ${log}`));
                    console.log(`   → Adjustment: ${momentum.adjustment > 0 ? '+' : ''}${momentum.adjustment}%`);
                }
            }


            // SANITY CAPS - Prevent illogical probabilities
            // 1. 8+ Wickets down cap
            if (wickets >= 8 && runsNeeded > 10) {
                const cap = wickets >= 9 ? 5 : 15;
                if (liveProbBat > cap) {
                    console.log(`   🚫 [SANITY CAP] 8+ wickets down (${wickets}) -> Capping at ${cap}%`);
                    liveProbBat = Math.min(liveProbBat, cap);
                }
            }

            // 2. High RRR Cap
            if (rrr > 12 && runsNeeded > 15) {
                if (liveProbBat > 10) {
                    console.log(`   🚫 [SANITY CAP] RRR > 12 -> Capping at 10%`);
                    liveProbBat = Math.min(liveProbBat, 10);
                }
            }

            console.log(`   → Final 2nd innings probability: ${liveProbBat.toFixed(0)}%`);
        }
    }

    // Clamp
    liveProbBat = Math.max(1, Math.min(99, liveProbBat));

    // Force Result (override all blending if match is decisively over)
    if (currentInningIndex > 0) { // 2nd Innings checks
        const r = parseInt(currentInning.Total || "0");
        const w = parseInt(currentInning.Wickets || "0");
        const t = parseInt(currentInning.Target || "0");

        if (w >= 10 || (currentInning.Overs === String(totalOvers) && r < t)) {
            liveProbBat = 0; // All out or out of overs = LOSS
            console.log(`   🏁 MATCH OVER: ${battingTeam} Lost (Force 0%)`);
        } else if (t > 0 && r >= t) {
            liveProbBat = 100; // Target reached = WIN
            console.log(`   🏁 MATCH OVER: ${battingTeam} Won (Force 100%)`);
        }
    }

    // Blend with Pre-Match Probability
    // Increase steepness: reach 100% live by 90% progress (e.g. 18th over in T20)
    // Formula: min(1, 0.4 + (0.7 * progress)) -> reaches 1.0 at ~0.85 progress
    // Wait, old was 0.4 + 0.6*p. Let's make it hit 1.0 at 0.9 progress
    // 0.2 + 0.9*p ? at 0.9 -> 1.01. Yes.
    // Let's use steepLiveWeight = Math.min(1, 0.2 + (0.9 * progress));
    const steepLiveWeight = Math.min(1, 0.2 + (0.9 * progress));

    // If we forced a result (0 or 100), weight MUST be 1.0
    const finalLiveWeight = (liveProbBat === 0 || liveProbBat === 100) ? 1.0 : steepLiveWeight;

    const preMatchBatProb = isTeam1Batting ? preMatchProb.team1.probability : preMatchProb.team2.probability;
    const finalBatProb = (preMatchBatProb * (1 - finalLiveWeight)) + (liveProbBat * finalLiveWeight);
    const finalProb = Math.max(0, Math.min(100, finalBatProb)); // Allow 0/100 now

    console.log(`\n📈 [BLENDING]`);
    console.log(`   Pre-match ${battingTeam}: ${preMatchBatProb.toFixed(0)}%`);
    console.log(`   Live ${battingTeam}: ${liveProbBat.toFixed(0)}%`);
    console.log(`   Blended: (${preMatchBatProb.toFixed(0)} × ${((1 - finalLiveWeight) * 100).toFixed(0)}%) + (${liveProbBat.toFixed(0)} × ${(finalLiveWeight * 100).toFixed(0)}%) = ${finalBatProb.toFixed(1)}%`);

    // Calculate details for UI
    let details: WinProbabilityDetails = {};
    if (currentInningIndex === 0) {
        const runs = parseInt(currentInning.Total || "0");
        const crr = parseFloat(currentInning.Runrate || "0");
        const wickets = parseInt(currentInning.Wickets || "0");
        const oversLeft = Math.max(0, totalOvers - oversBowled);
        const resourceFactor = Math.max(0.1, 1 - (wickets * (wickets > 5 ? 0.12 : 0.08)));
        const projected = Math.floor(runs + (crr * oversLeft * resourceFactor));
        // Format-aware par score for details
        const parScore = format === 'T20' ? 170 : (format === 'ODI' ? 280 : 350);

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
