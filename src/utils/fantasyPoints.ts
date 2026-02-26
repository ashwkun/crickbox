/**
 * Fantasy Points Calculator
 * Parses real match formats (T20, OD, Test, T10, etc.) and awards points according to explicit Dream11 rules.
 */

export type FantasyFormat = 'IPL' | 'T20' | 'OTHER_T20' | 'OD' | 'OTHER_OD' | 'TEST' | 'OTHER_TEST' | 'T10' | 'SIXES' | 'HUNDRED';

export function determineFantasyFormat(match: any, scorecard: any): FantasyFormat {
    const format = (match?.event_format || scorecard?.Matchdetail?.Match?.Type || '').toUpperCase();
    const league = (match?.league_code || scorecard?.Matchdetail?.Series?.Name || '').toUpperCase();
    
    if (format.includes('T10')) return 'T10';
    if (format.includes('HUNDRED') || format.includes('100')) return 'HUNDRED';
    if (format.includes('SIXES')) return 'SIXES';

    if (format.includes('TEST') || format.includes('FIRST CLASS')) {
        if (league.includes('TEST') && !league.includes('INTERNATIONAL') && match?.league_code !== 'icc') return 'OTHER_TEST';
        return 'TEST';
    }

    if (format.includes('OD') || format.includes('LIST A') || format.includes('ONE DAY')) {
        if (!league.includes('INTERNATIONAL') && match?.league_code !== 'icc') return 'OTHER_OD';
        return 'OD';
    }

    if (league.includes('IPL') || league === 'ipl') return 'IPL';
    
    if (league.includes('INTERNATIONAL') || match?.league_code === 'icc' || match?.league_code === 't20i') {
        return 'T20';
    }
    
    return 'OTHER_T20';
}

interface BattingStats { runs: number; balls: number; fours: number; sixes: number; }
interface BowlingStats { wickets: number; runsConceded: number; overs: number; dots: number; lbwBowled: number; maidens: number; }

const RULES: Record<FantasyFormat, any> = {
    IPL: {
        BATTING: { run: 1, boundary: 1, six: 2, duck: -2, milestones: { 100: 16, 50: 8 } },
        BOWLING: { wicket: 25, dot: 0, lbwBowled: 8, maiden: 8, milestones: { 5: 16, 4: 8 } },
        ECO: { minOvers: 2, tiers: [{ max: 4.99, pts: 4 }, { min: 5, max: 6, pts: 2 }] },
        SR: { minBalls: 10, tiers: [{ min: 60, max: 70, pts: -2 }, { min: 50, max: 59.99, pts: -4 }, { max: 49.99, pts: -6 }] }
    },
    T20: {
        BATTING: { run: 1, boundary: 4, six: 6, duck: -2, milestones: { 100: 16, 75: 12, 50: 8, 25: 4 } },
        BOWLING: { wicket: 30, dot: 1, lbwBowled: 8, maiden: 12, milestones: { 5: 12, 4: 8, 3: 4 } },
        ECO: { minOvers: 2, tiers: [{ max: 4.99, pts: 6 }, { min: 5, max: 5.99, pts: 4 }, { min: 6, max: 7, pts: 2 }, { min: 10, max: 11, pts: -2 }, { min: 11.01, max: 12, pts: -4 }, { min: 12.01, pts: -6 }] },
        SR: { minBalls: 10, tiers: [{ min: 170.01, pts: 6 }, { min: 150, max: 170, pts: 4 }, { min: 130, max: 149.99, pts: 2 }, { min: 60, max: 70, pts: -2 }, { min: 50, max: 59.99, pts: -4 }, { max: 49.99, pts: -6 }] }
    },
    OTHER_T20: {
        BATTING: { run: 1, boundary: 1, six: 2, duck: -2, milestones: { 100: 16, 50: 8, 30: 4 } },
        BOWLING: { wicket: 30, dot: 0, lbwBowled: 8, maiden: 12, milestones: { 5: 16, 4: 8, 3: 4 } },
        ECO: { minOvers: 2, tiers: [{ max: 2.49, pts: 6 }, { min: 2.5, max: 3.49, pts: 4 }, { min: 3.5, max: 4.5, pts: 2 }, { min: 7, max: 8, pts: -2 }, { min: 8.02, max: 9, pts: -4 }, { min: 9.01, pts: -6 }] },
        SR: { minBalls: 20, tiers: [{ min: 140.01, pts: 6 }, { min: 120, max: 140, pts: 4 }, { min: 100, max: 119.99, pts: 2 }, { min: 40, max: 50, pts: -2 }, { min: 30, max: 39.99, pts: -4 }, { max: 29.99, pts: -6 }] }
    },
    OD: {
        BATTING: { run: 1, boundary: 4, six: 6, duck: -3, milestones: { 150: 24, 125: 20, 100: 16, 75: 12, 50: 8, 25: 4 } },
        BOWLING: { wicket: 30, dot: 0.33, lbwBowled: 8, maiden: 4, milestones: { 6: 12, 5: 8, 4: 4 } },
        ECO: { minOvers: 5, tiers: [{ max: 2.49, pts: 6 }, { min: 2.5, max: 3.49, pts: 4 }, { min: 3.5, max: 4.5, pts: 2 }, { min: 7, max: 8, pts: -2 }, { min: 8.01, max: 9, pts: -4 }, { min: 9.01, pts: -6 }] },
        SR: { minBalls: 20, tiers: [{ min: 140.01, pts: 6 }, { min: 120, max: 139.99, pts: 4 }, { min: 100, max: 119.99, pts: 2 }, { min: 40, max: 50, pts: -2 }, { min: 30, max: 39.99, pts: -4 }, { max: 29.99, pts: -6 }] }
    },
    OTHER_OD: {
        BATTING: { run: 1, boundary: 1, six: 2, duck: -3, milestones: { 100: 8, 50: 4 } },
        BOWLING: { wicket: 30, dot: 0, lbwBowled: 8, maiden: 4, milestones: { 5: 8, 4: 4 } },
        ECO: { minOvers: 5, tiers: [{ max: 2.49, pts: 6 }, { min: 2.5, max: 3.49, pts: 4 }, { min: 3.5, max: 4.5, pts: 2 }, { min: 7, max: 8, pts: -2 }, { min: 8.01, max: 9, pts: -4 }, { min: 9.01, pts: -6 }] },
        SR: { minBalls: 20, tiers: [{ min: 140.01, pts: 6 }, { min: 120, max: 139.99, pts: 4 }, { min: 100, max: 119.99, pts: 2 }, { min: 40, max: 50, pts: -2 }, { min: 30, max: 39.99, pts: -4 }, { max: 29.99, pts: -6 }] }
    },
    TEST: {
        BATTING: { run: 1, boundary: 4, six: 6, duck: -4, milestones: { 150: 24, 125: 20, 100: 16, 75: 12, 50: 8, 25: 4 } },
        BOWLING: { wicket: 20, dot: 0, lbwBowled: 8, maiden: 0, milestones: { 6: 12, 5: 8, 4: 4 } },
        ECO: null, SR: null
    },
    OTHER_TEST: {
        BATTING: { run: 1, boundary: 1, six: 2, duck: -4, milestones: { 100: 8, 50: 4 } },
        BOWLING: { wicket: 16, dot: 0, lbwBowled: 8, maiden: 0, milestones: { 5: 8, 4: 4 } },
        ECO: null, SR: null
    },
    T10: {
        BATTING: { run: 1, boundary: 4, six: 6, duck: -2, milestones: { 100: 20, 75: 16, 50: 12, 25: 8 } },
        BOWLING: { wicket: 30, dot: 1, lbwBowled: 8, maiden: 16, milestones: { 5: 16, 4: 12, 3: 8, 2: 4 } },
        ECO: { minOvers: 1, tiers: [{ max: 6.99, pts: 6 }, { min: 7, max: 7.99, pts: 4 }, { min: 8, max: 9, pts: 2 }, { min: 14, max: 15, pts: -2 }, { min: 15.01, max: 16, pts: -4 }, { min: 16.01, pts: -6 }] },
        SR: { minBalls: 5, tiers: [{ min: 190.01, pts: 6 }, { min: 170, max: 190, pts: 4 }, { min: 150, max: 169.99, pts: 2 }, { min: 70, max: 80, pts: -2 }, { min: 60, max: 69.99, pts: -4 }, { max: 59.99, pts: -6 }] }
    },
    SIXES: {
        BATTING: { run: 1, boundary: 4, six: 6, duck: -2, milestones: {} },
        BOWLING: { wicket: 25, dot: 1, lbwBowled: 8, maiden: 25, milestones: { 3: 16, 2: 8 } },
        ECO: null, SR: null
    },
    HUNDRED: {
        BATTING: { run: 1, boundary: 1, six: 2, duck: -2, milestones: { 100: 20, 50: 10, 30: 5 } },
        BOWLING: { wicket: 25, dot: 0, lbwBowled: 8, maiden: 0, milestones: { 5: 20, 4: 10, 3: 5, 2: 3 } },
        ECO: null, SR: null
    }
};

export function calcRealTimeBatFP(stats: BattingStats, format: FantasyFormat): number {
    const rules = RULES[format] || RULES['T20'];
    const b = rules.BATTING;
    let fp = 0;

    fp += (stats.runs * b.run) + (stats.fours * b.boundary) + (stats.sixes * b.six);
    if (stats.runs === 0 && stats.balls > 0) fp += b.duck;

    const msKeys = Object.keys(b.milestones).map(Number).sort((x, y) => y - x);
    for (const ms of msKeys) {
        if (stats.runs >= ms) {
            fp += b.milestones[ms];
            break; 
        }
    }

    if (rules.SR && stats.balls >= rules.SR.minBalls) {
        const sr = (stats.runs / stats.balls) * 100;
        for (const tier of rules.SR.tiers) {
            if ((tier.min === undefined || sr >= tier.min) && (tier.max === undefined || sr <= tier.max)) {
                fp += tier.pts;
                break;
            }
        }
    }
    return fp;
}

export function calcRealTimeBowlFP(stats: BowlingStats, format: FantasyFormat): number {
    const rules = RULES[format] || RULES['T20'];
    const b = rules.BOWLING;
    let fp = 0;

    fp += (stats.wickets * b.wicket) + (stats.lbwBowled * b.lbwBowled) + (stats.dots * b.dot) + (stats.maidens * b.maiden);
    
    const msKeys = Object.keys(b.milestones).map(Number).sort((x, y) => y - x);
    for (const w of msKeys) {
        if (stats.wickets >= w) {
            fp += b.milestones[w];
            break;
        }
    }

    if (rules.ECO && stats.overs >= rules.ECO.minOvers) {
        const eco = stats.runsConceded / stats.overs;
        for (const tier of rules.ECO.tiers) {
            if ((tier.min === undefined || eco >= tier.min) && (tier.max === undefined || eco <= tier.max)) {
                fp += tier.pts;
                break;
            }
        }
    }
    return fp;
}
