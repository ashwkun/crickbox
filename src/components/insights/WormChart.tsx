import React, { useMemo } from 'react';
import { OverByOverEntry } from '../../utils/h2hApi';
import { getTeamColor } from '../../utils/teamColors';

interface WormChartProps {
    innings1: OverByOverEntry[] | null;
    innings2: OverByOverEntry[] | null;
    team1Name: string;
    team2Name: string;
    team1ShortName: string;
    team2ShortName: string;
    team1Id?: string;
    team2Id?: string;
}

const WormChart: React.FC<WormChartProps> = ({
    innings1,
    innings2,
    team1Name,
    team2Name,
    team1ShortName,
    team2ShortName,
    team1Id,
    team2Id
}) => {
    // Calculate cumulative runs and wickets for each innings
    const processInnings = (data: OverByOverEntry[] | null) => {
        if (!data) return { points: [], wickets: [], totalWickets: 0 };
        let total = 0;
        let totalWickets = 0;
        const pts: { over: number; total: number }[] = [];
        const wkts: { over: number; total: number; count: number }[] = [];

        data.forEach(over => {
            total += parseInt(over.Runs) || 0;
            const w = parseInt(over.Wickets) || 0;
            totalWickets += w;
            pts.push({ over: over.Over, total });
            if (w > 0) {
                wkts.push({ over: over.Over, total, count: w });
            }
        });
        return { points: pts, wickets: wkts, totalWickets };
    };

    const { points: cumulative1, wickets: wickets1, totalWickets: wkts1 } = useMemo(() => processInnings(innings1), [innings1]);
    const { points: cumulative2, wickets: wickets2, totalWickets: wkts2 } = useMemo(() => processInnings(innings2), [innings2]);

    // If no data, don't render
    if (cumulative1.length === 0 && cumulative2.length === 0) {
        return null;
    }

    // Chart dimensions
    const width = 340; // Increased width slightly
    const height = 180; // Increased height
    const padding = { top: 20, right: 20, bottom: 25, left: 30 }; // Adjusted padding
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate scales
    // Default to at least 20 overs (T20 format) or max played, handles start of innings clearly
    const maxOvers = Math.max(
        cumulative1.length > 0 ? cumulative1[cumulative1.length - 1].over : 0,
        cumulative2.length > 0 ? cumulative2[cumulative2.length - 1].over : 0,
        20
    );
    const maxRuns = Math.max(
        cumulative1.length > 0 ? cumulative1[cumulative1.length - 1].total : 0,
        cumulative2.length > 0 ? cumulative2[cumulative2.length - 1].total : 0,
        100 // Minimum runs to avoid flat line
    ) * 1.1; // Add 10% headroom

    // Generate SVG polyline points
    const generatePolyline = (data: { over: number; total: number }[]) => {
        if (data.length === 0) return '';
        return data.map(d => {
            const x = padding.left + (d.over / maxOvers) * chartWidth;
            const y = padding.top + chartHeight - (d.total / maxRuns) * chartHeight;
            return `${x},${y}`;
        }).join(' ');
    };

    const polyPoints1 = generatePolyline(cumulative1);
    const polyPoints2 = generatePolyline(cumulative2);

    // Helper to get coordinates for a specific point (for wickets)
    const getPointCoords = (over: number, total: number) => {
        const x = padding.left + (over / maxOvers) * chartWidth;
        const y = padding.top + chartHeight - (total / maxRuns) * chartHeight;
        return { x, y };
    };

    // Team colors
    const color1 = getTeamColor(team1Name) || '#3b82f6';
    const color2 = getTeamColor(team2Name) || '#ef4444';

    // Grid config
    const yTicks = [0, Math.round(maxRuns / 2), Math.round(maxRuns)];
    const xTicks: number[] = [];
    for (let i = 5; i <= maxOvers; i += 5) xTicks.push(i);

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            padding: '16px 12px',
            border: '1px solid var(--border-color)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Chart Area */}
            <div style={{ position: 'relative', width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>

                    {/* Grid lines */}
                    {yTicks.map((tick, i) => {
                        const y = padding.top + chartHeight - (tick / maxRuns) * chartHeight;
                        if (isNaN(y)) return null;
                        return (
                            <g key={`y-${tick}-${i}`}>
                                <line
                                    x1={padding.left} y1={y}
                                    x2={width - padding.right} y2={y}
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth={1}
                                    strokeDasharray="4,4"
                                />
                                <text
                                    x={padding.left - 8} y={y + 3}
                                    fill="rgba(255,255,255,0.3)"
                                    fontSize={9} fontWeight={600}
                                    textAnchor="end"
                                >
                                    {tick}
                                </text>
                            </g>
                        );
                    })}

                    {/* X-axis ticks */}
                    {xTicks.map(tick => {
                        const x = padding.left + (tick / maxOvers) * chartWidth;
                        return (
                            <text
                                key={`x-${tick}`}
                                x={x} y={height - 8}
                                fill="rgba(255,255,255,0.3)"
                                fontSize={9} fontWeight={600}
                                textAnchor="middle"
                            >
                                {tick}
                            </text>
                        );
                    })}

                    {/* Innings 1 Line */}
                    {polyPoints1 && (
                        <polyline
                            points={polyPoints1}
                            fill="none"
                            stroke={color1}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {/* Innings 2 Line */}
                    {polyPoints2 && (
                        <polyline
                            points={polyPoints2}
                            fill="none"
                            stroke={color2}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="4,3"
                        />
                    )}

                    {/* Wickets 1 */}
                    {wickets1.map((w, i) => {
                        const { x, y } = getPointCoords(w.over, w.total);
                        return (
                            <circle key={`w1-${i}`} cx={x} cy={y} r={3} fill={color1} stroke="var(--bg-card)" strokeWidth={1} />
                        );
                    })}

                    {/* Wickets 2 */}
                    {wickets2.map((w, i) => {
                        const { x, y } = getPointCoords(w.over, w.total);
                        return (
                            <circle key={`w2-${i}`} cx={x} cy={y} r={3} fill={color2} stroke="var(--bg-card)" strokeWidth={1} />
                        );
                    })}
                </svg>
            </div>

            {/* Compact Legend */}
            <div style={{
                display: 'flex', justifyContent: 'center', gap: 16,
                marginTop: 4, fontSize: 11, fontWeight: 500
            }}>
                {cumulative1.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 16, height: 2, background: color1, borderRadius: 1 }} />
                        <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                            {team1ShortName}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{cumulative1[cumulative1.length - 1]?.total}/{wkts1}</span>
                    </div>
                )}
                {cumulative2.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 16, height: 2, background: color2, borderRadius: 1, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, var(--bg-card) 3px, var(--bg-card) 5px)' }} />
                        <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                            {team2ShortName}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{cumulative2[cumulative2.length - 1]?.total}/{wkts2}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WormChart;
