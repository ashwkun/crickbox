import { proxyFetch } from './api';

const WALLSTREAM_CLIENT = 'lx/QMpdauKZQKYaddAs76w==';

export interface BallData {
    over: string;
    runs: string;
    detail: string; // 'w' = wicket, 'wd' = wide, 'lb' = leg bye, etc.
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
    thisOver: string[]; // e.g., ['1', '4', '6', 'W', '0']
    currentScore?: string;
    currentWickets?: string;
    isWicket: boolean;
    isFour: boolean;
    isSix: boolean;
    isball: boolean;
}

export interface WallstreamData {
    balls: BallData[];
    latestBall: BallData | null;
}

// Parse ball value from This_Over format
// e.g., "0(W)" -> "W", "1(1LB)" -> "1LB", "1(1WD)" -> "1WD", "4" -> "4"
const parseBallValue = (ball: string): string => {
    if (!ball) return '';

    // Handle formats like "0(W)", "1(1LB)", "1(1WD)"
    const match = ball.match(/\d*\((.+)\)/);
    if (match) {
        return match[1]; // Return what's inside parentheses
    }
    return ball;
};

// Extract numeric match_id from game_id
// e.g., "cabidn12252025268741" -> "268741" (last 6 digits)
export const extractMatchId = (gameId: string): string => {
    // Remove all non-numeric characters, take last 6 digits
    const numericPart = gameId.replace(/\D/g, '');
    return numericPart.slice(-6);
};

export const fetchWallstream = async (gameId: string, pageSize = 10, inningsCount = 1): Promise<WallstreamData> => {
    try {
        const matchId = extractMatchId(gameId);
        // Session corresponds to innings number (1 = first innings, 2 = second innings, etc.)
        const session = inningsCount || 1;
        const url = `https://www.wisden.com/functions/wallstream/?sport_id=1&client_id=${encodeURIComponent(WALLSTREAM_CLIENT)}&match_id=${matchId}&page_size=${pageSize}&page_no=1&session=${session}`;

        // Always bypass cache for live ball-by-ball data
        const data = await proxyFetch(url, true);

        if (!data?.assets || !Array.isArray(data.assets)) {
            return { balls: [], latestBall: null };
        }

        const balls: BallData[] = data.assets
            .filter((a: any) => a.type === 'Commentary' && a.custom_metadata?.asset)
            .map((a: any) => {
                try {
                    const asset = JSON.parse(a.custom_metadata.asset);
                    const thisOverStr = asset.This_Over || '';
                    // Parse each ball in This_Over (e.g., "1,4,0(W)," -> ["1", "4", "W"])
                    const thisOverBalls = thisOverStr
                        .split(',')
                        .filter((b: string) => b !== '')
                        .map(parseBallValue);

                    const detail = (asset.Detail || '').toLowerCase();
                    const runs = asset.Runs || '0';
                    const isWicket = detail === 'w';
                    const isFour = runs === '4' || asset.Isboundary === true;
                    const isSix = runs === '6';
                    const isball = asset.Isball === true;

                    return {
                        over: asset.Over || '',
                        runs,
                        detail,
                        commentary: asset.Commentary || '',
                        batsmanName: asset.Batsman_Details?.name || asset.Batsman_Name || '',
                        batsmanRuns: asset.Batsman_Details?.Runs || '0',
                        batsmanBalls: asset.Batsman_Details?.Balls || '0',
                        batsmanFours: asset.Batsman_Details?.Fours || '0',
                        batsmanSixes: asset.Batsman_Details?.Sixes || '0',
                        nonStrikerName: asset.Non_Striker_Details?.name || '',
                        nonStrikerRuns: asset.Non_Striker_Details?.Runs || '0',
                        nonStrikerBalls: asset.Non_Striker_Details?.Balls || '0',
                        bowlerName: asset.Bowler_Details?.name || asset.Bowler_Name || '',
                        bowlerOvers: asset.Bowler_Details?.Overs || '0',
                        bowlerRuns: asset.Bowler_Details?.Runs || '0',
                        bowlerWickets: asset.Bowler_Details?.Wickets || '0',
                        bowlerMaidens: asset.Bowler_Details?.Maidens || '0',
                        thisOver: thisOverBalls,
                        currentScore: asset.Over_Summary?.Score?.split('/')[0] || '',
                        currentWickets: asset.Over_Summary?.Score?.split('/')[1] || '',
                        isWicket,
                        isFour,
                        isSix,
                        isball,
                        // IDs for inference
                        batsmanId: asset.Batsman_Details?.id || asset.Batsman || '',
                        nonStrikerId: asset.Non_Striker_Details?.id || '',
                        bowlerId: asset.Bowler_Details?.id || asset.Bowler || '',
                    };
                } catch {
                    return null;
                }
            })
            .filter((b: BallData | null) => b !== null) as BallData[]; // Include balls and events

        return {
            balls, // contains both balls and events for the timeline
            latestBall: balls.find(b => b.isball) || null, // ensure hero card shows actual player data from latest *ball*
        };
    } catch (error) {
        console.error('Wallstream fetch error:', error);
        return { balls: [], latestBall: null };
    }
};
