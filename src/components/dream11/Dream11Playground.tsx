import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { predictDream11, fetchScorecard, calcBatFP, calcBowlFP, D11 } from '../../utils/dream11Predictor';

interface CompletedMatch {
    id: string;
    match_date: string;
    series_id: string;
    team_home_id: string;
    team_away_id: string;
    team_home_name?: string;
    team_away_name?: string;
    result?: string;
}

interface PlayerComparison {
    name: string;
    role: string;
    team: string;
    predictedScore: number;
    actualFP: number;
    delta: number;
    wasSelected: boolean;
    isActualTop11: boolean;
    wasCaptain: boolean;
    wasViceCaptain: boolean;
    predictedRank: number;
    actualRank: number;
}

interface BacktestResult {
    match: CompletedMatch;
    comparisons: PlayerComparison[];
    logs: string[];
    accuracy: {
        mae: number;
        teamOverlap: number;
        captainActualRank: number;
        vcActualRank: number;
        correlation: number;
        top11ActualAvgFP: number;
        selectedAvgFP: number;
    };
}

function calculateActualFP(scorecard: any): Map<string, { batFP: number; bowlFP: number; totalFP: number; batDetail: string; bowlDetail: string }> {
    const fpMap = new Map<string, { batFP: number; bowlFP: number; totalFP: number; batDetail: string; bowlDetail: string }>();

    // Innings is an ARRAY, not an object
    const innings = scorecard?.Innings || [];
    if (!Array.isArray(innings)) return fpMap;

    for (const innData of innings) {
        // Batsmen is an ARRAY with player ID in .Batsman field
        const batsmen = innData.Batsmen || [];
        for (const bat of batsmen) {
            const playerId = bat.Batsman; // player ID like "13177"
            if (!playerId) continue;

            const runs = parseInt(bat.Runs) || 0;
            const balls = parseInt(bat.Balls) || 0;
            const fours = parseInt(bat.Fours) || 0;
            const sixes = parseInt(bat.Sixes) || 0;
            const fp = calcBatFP(runs, balls, fours, sixes);

            const existing = fpMap.get(playerId) || { batFP: 0, bowlFP: 0, totalFP: 0, batDetail: '', bowlDetail: '' };
            existing.batFP += fp;
            existing.batDetail = `${runs}(${balls}) ${fours}×4 ${sixes}×6 → ${fp}FP`;
            existing.totalFP = existing.batFP + existing.bowlFP;
            fpMap.set(playerId, existing);
        }

        // Bowlers is an ARRAY with player ID in .Bowler field
        const bowlers = innData.Bowlers || [];
        for (const bowl of bowlers) {
            const playerId = bowl.Bowler; // player ID
            if (!playerId) continue;

            const wickets = parseInt(bowl.Wickets) || 0;
            const runs = parseInt(bowl.Runs) || 0;
            const overs = parseFloat(bowl.Overs) || 0;
            const fp = calcBowlFP(wickets, runs, overs);

            const existing = fpMap.get(playerId) || { batFP: 0, bowlFP: 0, totalFP: 0, batDetail: '', bowlDetail: '' };
            existing.bowlFP += fp;
            existing.bowlDetail = `${wickets}/${runs} in ${overs}ov → ${fp}FP`;
            existing.totalFP = existing.batFP + existing.bowlFP;
            fpMap.set(playerId, existing);
        }
    }

    return fpMap;
}

// Team ID → short name for ICC T20 WC 2026
const TEAM_NAMES: Record<string, string> = {
    '1': 'AUS', '3': 'ENG', '4': 'IND', '5': 'NZ', '6': 'PAK', '7': 'SA',
    '8': 'SL', '9': 'WI', '10': 'ZIM', '12': 'CAN', '13': 'IRE', '15': 'NEP',
    '16': 'SCO', '20': 'NAM', '21': 'UAE', '22': 'USA', '28': 'OMA',
    '637': 'NPL', '1188': 'AFG', '1298': 'ITA',
};

const WC_T20_SERIES_ID = '13203';

export default function Dream11Playground({ onBack }: { onBack: () => void }) {
    const [matches, setMatches] = useState<CompletedMatch[]>([]);
    const [selectedMatchId, setSelectedMatchId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [result, setResult] = useState<BacktestResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const logRef = useRef<HTMLPreElement>(null);

    // Load completed WC T20 matches only
    useEffect(() => {
        async function loadMatches() {
            setLoadingMatches(true);
            const { data } = await supabase
                .from('tournament_matches')
                .select('*')
                .eq('series_id', WC_T20_SERIES_ID)
                .eq('result', 'Match Ended')
                .order('match_date', { ascending: false });

            if (data) {
                setMatches(data as CompletedMatch[]);
            }
            setLoadingMatches(false);
        }
        loadMatches();
    }, []);

    async function runBacktest() {
        if (!selectedMatchId) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const selectedMatch = matches.find(m => m.id === selectedMatchId)!;

            // Step 1: Run prediction EXCLUDING this match
            const prediction = await predictDream11(selectedMatchId, selectedMatchId);

            // Step 2: Fetch actual scorecard for this match
            const scorecard = await fetchScorecard(selectedMatchId);
            if (!scorecard) throw new Error('Could not fetch scorecard for this match');

            // Step 3: Calculate actual FP from scorecard
            const actualFPMap = calculateActualFP(scorecard);

            // Step 4: Build comparisons
            const comparisons: PlayerComparison[] = prediction.allPlayers.map(p => {
                const actual = actualFPMap.get(p.playerId);
                return {
                    name: p.name,
                    role: p.role,
                    team: p.team,
                    predictedScore: p.totalScore,
                    actualFP: actual?.totalFP || 0,
                    delta: p.totalScore - (actual?.totalFP || 0),
                    wasSelected: p.selected,
                    isActualTop11: false, // filled below
                    wasCaptain: p.isCaptain,
                    wasViceCaptain: p.isViceCaptain,
                    predictedRank: 0,
                    actualRank: 0,
                };
            });

            // Rank by predicted score
            const byPredicted = [...comparisons].sort((a, b) => b.predictedScore - a.predictedScore);
            byPredicted.forEach((c, i) => c.predictedRank = i + 1);

            // Rank by actual FP
            const byActual = [...comparisons].sort((a, b) => b.actualFP - a.actualFP);
            byActual.forEach((c, i) => {
                c.actualRank = i + 1;
                if (i < 11) c.isActualTop11 = true;
            });

            // Step 5: Accuracy metrics
            const selectedPlayers = comparisons.filter(c => c.wasSelected);
            const actualTop11 = comparisons.filter(c => c.isActualTop11);
            const overlap = selectedPlayers.filter(sp => sp.isActualTop11).length;

            const mae = comparisons.reduce((s, c) => s + Math.abs(c.predictedScore - c.actualFP), 0) / comparisons.length;

            const captain = comparisons.find(c => c.wasCaptain);
            const vc = comparisons.find(c => c.wasViceCaptain);

            // Correlation
            const n = comparisons.length;
            const meanP = comparisons.reduce((s, c) => s + c.predictedScore, 0) / n;
            const meanA = comparisons.reduce((s, c) => s + c.actualFP, 0) / n;
            const cov = comparisons.reduce((s, c) => s + (c.predictedScore - meanP) * (c.actualFP - meanA), 0) / n;
            const stdP = Math.sqrt(comparisons.reduce((s, c) => s + (c.predictedScore - meanP) ** 2, 0) / n);
            const stdA = Math.sqrt(comparisons.reduce((s, c) => s + (c.actualFP - meanA) ** 2, 0) / n);
            const correlation = stdP > 0 && stdA > 0 ? cov / (stdP * stdA) : 0;

            // Add actual FP details to logs
            const backtestLogs = [...prediction.logs];
            backtestLogs.push('\n══════════════════════════════════');
            backtestLogs.push('ACTUAL RESULTS FROM SCORECARD');
            backtestLogs.push('══════════════════════════════════');
            byActual.forEach((c, i) => {
                const actual = actualFPMap.get(prediction.allPlayers.find(p => p.name === c.name)?.playerId || '');
                const marker = c.wasSelected ? (c.wasCaptain ? '👑' : c.wasViceCaptain ? '⭐' : '✅') : '  ';
                backtestLogs.push(`${marker} ${i + 1}. ${c.name} (${c.role}) — Actual: ${c.actualFP} FP | Predicted rank: #${c.predictedRank}`);
                if (actual?.batDetail) backtestLogs.push(`     Bat: ${actual.batDetail}`);
                if (actual?.bowlDetail) backtestLogs.push(`     Bowl: ${actual.bowlDetail}`);
            });

            backtestLogs.push('\n══════════════════════════════════');
            backtestLogs.push('ACCURACY METRICS');
            backtestLogs.push('══════════════════════════════════');
            backtestLogs.push(`MAE (Mean Absolute Error): ${mae.toFixed(1)}`);
            backtestLogs.push(`Team Overlap: ${overlap}/11 (${((overlap / 11) * 100).toFixed(0)}%)`);
            backtestLogs.push(`Correlation (pred vs actual): ${correlation.toFixed(3)}`);
            backtestLogs.push(`Captain ${captain?.name} → Actual rank #${captain?.actualRank} (${captain?.actualFP} FP)`);
            backtestLogs.push(`Vice-Captain ${vc?.name} → Actual rank #${vc?.actualRank} (${vc?.actualFP} FP)`);
            backtestLogs.push(`Selected 11 avg FP: ${(selectedPlayers.reduce((s, c) => s + c.actualFP, 0) / 11).toFixed(1)}`);
            backtestLogs.push(`Actual Top 11 avg FP: ${(actualTop11.reduce((s, c) => s + c.actualFP, 0) / 11).toFixed(1)}`);

            setResult({
                match: selectedMatch,
                comparisons: byActual, // sorted by actual FP
                logs: backtestLogs,
                accuracy: {
                    mae,
                    teamOverlap: overlap,
                    captainActualRank: captain?.actualRank || 0,
                    vcActualRank: vc?.actualRank || 0,
                    correlation,
                    top11ActualAvgFP: actualTop11.reduce((s, c) => s + c.actualFP, 0) / 11,
                    selectedAvgFP: selectedPlayers.reduce((s, c) => s + c.actualFP, 0) / 11,
                },
            });
        } catch (err: any) {
            setError(err.message || 'Backtest failed');
        } finally {
            setLoading(false);
        }
    }

    function copyLogs() {
        if (result) {
            navigator.clipboard.writeText(result.logs.join('\n'));
        }
    }

    return (
        <div className="dr11-playground">
            <div className="dr11-header">
                <button className="dr11-back" onClick={onBack}>← Back</button>
                <h2>🧪 Prediction Playground</h2>
            </div>

            <div className="playground-controls">
                <p className="playground-desc">
                    Select a completed match. The model will predict a team <strong>excluding that match's data</strong>,
                    then compare against actual D11 Fantasy Points from the real scorecard.
                </p>

                <div className="playground-select-row">
                    <select
                        value={selectedMatchId}
                        onChange={e => setSelectedMatchId(e.target.value)}
                        disabled={loading || loadingMatches}
                    >
                        <option value="">{loadingMatches ? 'Loading matches...' : `Select a match (${matches.length} available)...`}</option>
                        {matches.map(m => {
                            const home = TEAM_NAMES[m.team_home_id] || m.team_home_id;
                            const away = TEAM_NAMES[m.team_away_id] || m.team_away_id;
                            const date = m.match_date ? new Date(m.match_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '?';
                            return (
                                <option key={m.id} value={m.id}>
                                    {date} — {home} vs {away}
                                </option>
                            );
                        })}
                    </select>

                    <button
                        className="dr11-predict-btn"
                        onClick={runBacktest}
                        disabled={!selectedMatchId || loading}
                    >
                        {loading ? '⏳ Running...' : '▶ Run Backtest'}
                    </button>
                </div>
            </div>

            {error && <div className="dr11-error">{error}</div>}

            {result && (
                <>
                    {/* Accuracy metrics cards */}
                    <div className="playground-metrics">
                        <div className="metric-card">
                            <div className="metric-value">{result.accuracy.teamOverlap}/11</div>
                            <div className="metric-label">Team Overlap</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value">{result.accuracy.correlation.toFixed(2)}</div>
                            <div className="metric-label">Correlation</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value">{result.accuracy.mae.toFixed(1)}</div>
                            <div className="metric-label">MAE</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value">#{result.accuracy.captainActualRank}</div>
                            <div className="metric-label">Captain Rank</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value">{result.accuracy.selectedAvgFP.toFixed(0)}</div>
                            <div className="metric-label">Selected Avg FP</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value">{result.accuracy.top11ActualAvgFP.toFixed(0)}</div>
                            <div className="metric-label">Optimal Avg FP</div>
                        </div>
                    </div>

                    {/* Comparison table */}
                    <div className="playground-table-wrap">
                        <table className="playground-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Player</th>
                                    <th>Role</th>
                                    <th>Actual FP</th>
                                    <th>Pred Score</th>
                                    <th>Pred Rank</th>
                                    <th>Selected?</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.comparisons.map((c, i) => (
                                    <tr
                                        key={i}
                                        className={`${c.wasSelected ? 'row-selected' : ''} ${c.isActualTop11 ? 'row-top11' : ''}`}
                                    >
                                        <td>{i + 1}</td>
                                        <td>
                                            {c.wasCaptain && '👑 '}
                                            {c.wasViceCaptain && '⭐ '}
                                            {c.name}
                                        </td>
                                        <td><span className={`role-badge ${c.role}`}>{c.role}</span></td>
                                        <td className="num">{c.actualFP}</td>
                                        <td className="num">{c.predictedScore.toFixed(1)}</td>
                                        <td className="num">#{c.predictedRank}</td>
                                        <td className="center">
                                            {c.wasSelected && c.isActualTop11 && '✅'}
                                            {c.wasSelected && !c.isActualTop11 && '❌'}
                                            {!c.wasSelected && c.isActualTop11 && '⚠️'}
                                            {!c.wasSelected && !c.isActualTop11 && '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="playground-legend">
                        <span>✅ = Correctly picked</span>
                        <span>❌ = Picked but not top 11</span>
                        <span>⚠️ = Missed top performer</span>
                        <span>Highlighted = In our predicted XI</span>
                    </div>

                    {/* Decision Log */}
                    <div className="dr11-log-section">
                        <div className="dr11-log-header">
                            <h3>📋 Full Backtest Log</h3>
                            <button onClick={copyLogs} className="dr11-copy-btn">📋 Copy</button>
                        </div>
                        <pre ref={logRef} className="dr11-decision-log">
                            {result.logs.join('\n')}
                        </pre>
                    </div>
                </>
            )}
        </div>
    );
}
