// ============ TYPES ONLY ============
// Fetch function has been moved to useCricketData.ts

export interface BallData {
    over: string;
    runs: string;
    detail: string;
    commentary: string;
    batsmanName: string;
    batsmanRuns: string;
    batsmanBalls: string;
    batsmanFours: string;
    batsmanSixes: string;
    nonStrikerName: string;
    nonStrikerRuns: string;
    nonStrikerBalls: string;
    bowlerName: string;
    bowlerOvers: string;
    bowlerRuns: string;
    bowlerWickets: string;
    bowlerMaidens: string;
    thisOver: string[];
    currentScore?: string;
    currentWickets?: string;
    isWicket: boolean;
    isFour: boolean;
    isSix: boolean;
    isball: boolean;
    batsmanId?: string;
    nonStrikerId?: string;
    bowlerId?: string;
}

export interface WallstreamData {
    balls: BallData[];
    latestBall: BallData | null;
}

// Extract numeric match_id from game_id
// e.g., "cabidn12252025268741" -> "268741" (last 6 digits)
export const extractMatchId = (gameId: string): string => {
    const numericPart = gameId.replace(/\D/g, '');
    return numericPart.slice(-6);
};
