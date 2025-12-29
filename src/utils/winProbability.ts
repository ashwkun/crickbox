
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
    isFranchise: boolean = false
): WinProbabilityResult => {

    let prob1 = 50;
    const weights = isFranchise ? WEIGHTS.FRANCHISE : WEIGHTS.INTERNATIONAL;

    // 1. ICC Ranking / Pedigree
    if (!isFranchise) {
        // International: Use Ranking
        const rank1 = parseInt(team1.icc_ranking || "10") || 10;
        const rank2 = parseInt(team2.icc_ranking || "10") || 10;
        const rankDiff = rank2 - rank1; // Positive means team1 is better (lower rank)
        // Max diff usually ~10 spots. 1 spot = 2.5% swing (capped at 25%)
        prob1 += Math.min(25, Math.max(-25, rankDiff * 2.5)) * weights.RANKING!;
    } else {
        // Franchise: Pedigree (Mock: Equal for now unless passed)
    }

    // 2. Head to Head
    if (h2hData && parseInt(h2hData.matches_played) > 0) {
        const played = parseInt(h2hData.matches_played);
        const won1 = parseInt(h2hData.won);
        if (played > 0) {
            const winRate1 = (won1 / played) * 100;
            // Shift towards winRate1
            const h2hImpact = (winRate1 - 50);
            prob1 += h2hImpact * weights.H2H!;
        }
    }

    // 3. Recent Form
    const getFormScore = (form: string[]) => {
        if (!form || form.length === 0) return 50;
        let score = 0;
        form.forEach(res => {
            if (res === 'W') score += 1;
            else if (res === 'L') score += 0;
            else score += 0.5; // Draw/NR
        });
        return (score / Math.max(form.length, 1)) * 100;
    };

    const formScore1 = getFormScore(form1);
    const formScore2 = getFormScore(form2);
    const formDiff = formScore1 - formScore2;
    prob1 += formDiff * weights.FORM!;

    // 4. Home Advantage
    const home1 = getHomeAdvantage(team1, venueName);
    const home2 = getHomeAdvantage(team2, venueName);

    if (home1 && !home2) prob1 += 100 * weights.HOME!; // 10% boost
    if (!home1 && home2) prob1 -= 100 * weights.HOME!;

    // 5. Pitch Impact
    // This is minor in pre-match, usually applied to live. 
    // We can add small bias if needed

    // Clamp
    prob1 = Math.max(15, Math.min(85, prob1));

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
    format: 'T20' | 'ODI' | 'Test' = 'T20'
): WinProbabilityResult => { // Ignoring prevProb for simplicity now

    // Default safe return
    if (!scorecard || !scorecard.Innings || scorecard.Innings.length === 0) return preMatchProb;

    // Identify current innings
    const innings = scorecard.Innings;
    // For live match, use last available inning as "current"
    const currentInningIndex = innings.length - 1;
    const currentInning = innings[currentInningIndex];

    const batTeamName = currentInning.Battingteam;
    // Check if Team 1 is batting
    const isTeam1Batting = preMatchProb.team1.name === batTeamName;

    // Determine Overs Progress
    // Logic to handle "12.3" -> 12.5 overs
    const overStr = currentInning.Overs || "0";
    const totalOvers = format === 'T20' ? 20 : (format === 'ODI' ? 50 : 90);
    const oversBowled = parseFloat(overStr);
    const progress = Math.min(1, oversBowled / totalOvers);

    // Weight shifts from 0.4 (start) to 0.9 (end)
    // At start: 60% PreMatch, 40% Live (Pitch, Conditions, Start)
    // At end: 10% PreMatch, 90% Live (Scoreboard pressure)
    const liveWeight = 0.4 + (0.55 * progress);

    let liveProbBat = 50;

    // --- LIVE LOGIC ---

    if (currentInningIndex === 0) {
        // 1st Innings: Projected vs Par
        const runs = parseInt(currentInning.Total || "0");
        const crr = parseFloat(currentInning.Runrate || "0");
        const wickets = parseInt(currentInning.Wickets || "0");
        const oversLeft = Math.max(0, totalOvers - oversBowled);

        // Resource Factor (Wickets penalty)
        // 0-2 wkts: 1.0, 5 wkts: 0.8, 9 wkts: 0.2
        const resourceFactor = Math.max(0.1, 1 - (wickets * (wickets > 5 ? 0.12 : 0.08)));

        const projected = runs + (crr * oversLeft * resourceFactor);
        const parScore = totalOvers === 20 ? 170 : 280; // Hardcoded avg for now

        // Win% based on projected lead over par
        const diff = projected - parScore;
        // +20 runs = +10% win chance roughly
        liveProbBat = 50 + (diff * 0.5);

    } else {
        // 2nd Innings: Chase Pressure
        // Target is usually in Innings[0].Total + 1, OR explicitly in Target field
        let target = parseInt(currentInning.Target || "0");
        if (!target && innings[0]) target = parseInt(innings[0].Total || "0") + 1;
        if (!target) target = 200; // Fallback

        const runs = parseInt(currentInning.Total || "0");
        const wickets = parseInt(currentInning.Wickets || "0");

        // Balls Remaining
        // 12.3 -> 12 * 6 + 3 = 75 balls bowled
        const ballsBowled = Math.floor(oversBowled) * 6 + Math.round((oversBowled % 1) * 10);
        const ballsLeft = (totalOvers * 6) - ballsBowled;
        const runsNeeded = target - runs;

        if (runs >= target) liveProbBat = 100;
        else if (wickets >= 10 || ballsLeft <= 0) liveProbBat = 0;
        else {
            const rrr = runsNeeded / (Math.max(1, ballsLeft) / 6);
            const wicketsLeft = 10 - wickets;

            // Base Calculation (RRR Pressure)
            if (rrr > 13) liveProbBat = 5;
            else if (rrr > 12) liveProbBat = 10;
            else if (rrr > 10) liveProbBat = 20;
            else if (rrr > 9) liveProbBat = 35;
            else if (rrr > 8) liveProbBat = 45;
            else if (rrr < 6) liveProbBat = 80;
            else liveProbBat = 60; // 6-8 is manageable

            // Wicket Penalty
            if (wicketsLeft < 3) liveProbBat *= 0.3;
            else if (wicketsLeft < 5) liveProbBat *= 0.6;

            // Balls Left Penalty (Death overs pressure)
            if (ballsLeft < 12 && runsNeeded > 20) liveProbBat *= 0.5;
        }
    }

    // Clamp Live Prob
    liveProbBat = Math.max(1, Math.min(99, liveProbBat));

    // Blend: (PreMath * (1-w)) + (Live * w)
    // Note: PreMatch prob is for Team1. We need to respect that.

    const preMatchBatProb = isTeam1Batting ? preMatchProb.team1.probability : preMatchProb.team2.probability;
    const finalBatProb = (preMatchBatProb * (1 - liveWeight)) + (liveProbBat * liveWeight);

    const finalProb = Math.max(1, Math.min(99, finalBatProb));

    // Calculate details for UI
    let details: WinProbabilityDetails = {};
    if (currentInningIndex === 0) {
        // Re-calculate or accessible vars? Need to scope them up or recalculate.
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
        // Balls Remaining
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

    return {
        team1: {
            name: preMatchProb.team1.name,
            probability: isTeam1Batting ? finalProb : 100 - finalProb
        },
        team2: {
            name: preMatchProb.team2.name,
            probability: isTeam1Batting ? 100 - finalProb : finalProb
        },
        phase: progress < 0.3 ? 'early' : progress < 0.8 ? 'mid' : 'death',
        message: currentInningIndex === 0 ? 'Setting Target' : 'Chase On',
        details: details
    };
};
