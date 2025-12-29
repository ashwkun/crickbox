import React, { useMemo } from 'react';
import { OverByOverResponse } from '../../utils/h2hApi';

interface WormData {
    data: OverByOverResponse | null;
    label: string;
    color: string;
}

interface WormChartProps {
    primary?: WormData | null;
    secondary?: WormData | null;
    matchFormat?: string;
}

const WormChart: React.FC<WormChartProps> = ({
    primary,
    secondary,
    matchFormat
}) => {
    // Helper to process data
    const processInnings = (data: OverByOverResponse | null) => {
        if (!data?.Overbyover) return { points: [], wickets: [], totalWickets: 0 };
        let total = 0;
        let totalWickets = 0;
        const pts: { over: number; total: number }[] = [];
        const wkts: { over: number; total: number; count: number }[] = [];

        data.Overbyover.forEach(over => {
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

    const { points: ptsPrimary, wickets: wktsPrimary, totalWickets: totalWktsPrimary } = useMemo(() => processInnings(primary?.data || null), [primary?.data]);
    const { points: ptsSecondary, wickets: wktsSecondary, totalWickets: totalWktsSecondary } = useMemo(() => processInnings(secondary?.data || null), [secondary?.data]);

    // If no data, don't render
    if (ptsPrimary.length === 0 && ptsSecondary.length === 0) {
        return null;
    }

    // Chart dimensions
    const width = 340;
    const height = 180;
    const padding = { top: 20, right: 20, bottom: 25, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate scales
    const maxPrimary = ptsPrimary.length > 0 ? ptsPrimary[ptsPrimary.length - 1] : { over: 0, total: 0 };
    const maxSecondary = ptsSecondary.length > 0 ? ptsSecondary[ptsSecondary.length - 1] : { over: 0, total: 0 };

    let maxOvers = 20;
    let maxRuns = 100;

    // SCALING LOGIC
    // Primary is Current, Secondary is Target/Past
    if (ptsSecondary.length === 0) {
        // Mode: Setting Target (1st Innings) -> Zoom to fit Current
        maxOvers = Math.max(maxPrimary.over, 5);
        maxRuns = Math.max(maxPrimary.total, 50) * 1.1;
    } else {
        // Mode: Chasing / Comparing -> Fit Both
        // Base overs based on format
        let formatBaseOvers = 0;
        if (matchFormat?.toLowerCase().includes('t20') || matchFormat?.toLowerCase().includes('hundred')) {
            formatBaseOvers = 20;
        } else if (matchFormat?.toLowerCase().includes('odi') || matchFormat?.toLowerCase().includes('one day')) {
            formatBaseOvers = 50;
        } else if (matchFormat?.toLowerCase().includes('test')) {
            // Test matches grow indefinitely, default small until data exists
            formatBaseOvers = 20;
        }

        // Scale to the larger of the two (Target vs Current)
        maxOvers = Math.max(maxPrimary.over, maxSecondary.over, formatBaseOvers);
        maxRuns = Math.max(maxPrimary.total, maxSecondary.total, 100) * 1.1;
    }

    // Generate SVG polyline points
    const generatePolyline = (data: { over: number; total: number }[]) => {
        if (data.length === 0) return '';
        return data.map(d => {
            const x = padding.left + (d.over / maxOvers) * chartWidth;
            const y = padding.top + chartHeight - (d.total / maxRuns) * chartHeight;
            return `${x},${y}`;
        }).join(' ');
    };

    const polyPrimary = generatePolyline(ptsPrimary);
    const polySecondary = generatePolyline(ptsSecondary);

    const getPointCoords = (over: number, total: number) => {
        const x = padding.left + (over / maxOvers) * chartWidth;
        const y = padding.top + chartHeight - (total / maxRuns) * chartHeight;
        return { x, y };
    };

    // Colors
    const colorPrimary = primary?.color || '#3b82f6';
    const colorSecondary = secondary?.color || '#9ca3af'; // Grey default for secondary if missing

    // Grid config
    const yTicks = [0, Math.round(maxRuns / 2), Math.round(maxRuns)];
    const xTicks: number[] = [];
    // Dynamic X-ticks based on length
    const step = maxOvers > 50 ? 10 : 5;
    for (let i = step; i <= maxOvers; i += step) xTicks.push(i);

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

                    {/* Secondary Line (Dashed) - Render first to be behind */}
                    {polySecondary && (
                        <polyline
                            points={polySecondary}
                            fill="none"
                            stroke={colorSecondary}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="4,3"
                            opacity={0.6}
                        />
                    )}

                    {/* Primary Line (Solid) */}
                    {polyPrimary && (
                        <polyline
                            points={polyPrimary}
                            fill="none"
                            stroke={colorPrimary}
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {/* Wickets Secondary */}
                    {wktsSecondary.map((w, i) => {
                        const { x, y } = getPointCoords(w.over, w.total);
                        return (
                            <circle key={`w2-${i}`} cx={x} cy={y} r={2.5} fill={colorSecondary} stroke="var(--bg-card)" strokeWidth={1} />
                        );
                    })}

                    {/* Wickets Primary */}
                    {wktsPrimary.map((w, i) => {
                        const { x, y } = getPointCoords(w.over, w.total);
                        return (
                            <circle key={`w1-${i}`} cx={x} cy={y} r={3} fill={colorPrimary} stroke="var(--bg-card)" strokeWidth={1} />
                        );
                    })}
                </svg>
            </div>

            {/* Compact Legend */}
            <div style={{
                display: 'flex', justifyContent: 'center', gap: 16,
                marginTop: 4, fontSize: 11, fontWeight: 500
            }}>
                {ptsPrimary.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 16, height: 3, background: colorPrimary, borderRadius: 1.5 }} />
                        <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                            {primary?.label} (Curr)
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{maxPrimary.total}/{totalWktsPrimary}</span>
                    </div>
                )}
                {ptsSecondary.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 16, height: 2, background: colorSecondary, borderRadius: 1, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, var(--bg-card) 3px, var(--bg-card) 5px)' }} />
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                            {secondary?.label}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{maxSecondary.total}/{totalWktsSecondary}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WormChart;
