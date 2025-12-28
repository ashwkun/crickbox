import React, { useMemo } from 'react';
import { OverByOverEntry } from '../../utils/h2hApi';
import { getTeamColor } from '../../utils/teamColors';

interface WormChartProps {
    innings1: OverByOverEntry[] | null;
    innings2: OverByOverEntry[] | null;
    team1Name: string;
    team2Name: string;
    team1Id?: string;
    team2Id?: string;
}

const WormChart: React.FC<WormChartProps> = ({
    innings1,
    innings2,
    team1Name,
    team2Name,
    team1Id,
    team2Id
}) => {
    // Calculate cumulative runs for each innings
    const cumulative1 = useMemo(() => {
        if (!innings1) return [];
        let total = 0;
        return innings1.map(over => {
            total += parseInt(over.Runs) || 0;
            return { over: over.Over, total };
        });
    }, [innings1]);

    const cumulative2 = useMemo(() => {
        if (!innings2) return [];
        let total = 0;
        return innings2.map(over => {
            total += parseInt(over.Runs) || 0;
            return { over: over.Over, total };
        });
    }, [innings2]);

    // If no data, don't render
    if (cumulative1.length === 0 && cumulative2.length === 0) {
        return null;
    }

    // Chart dimensions
    const width = 320;
    const height = 160;
    const padding = { top: 20, right: 16, bottom: 30, left: 36 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate scales
    const maxOvers = Math.max(
        cumulative1.length > 0 ? cumulative1[cumulative1.length - 1].over : 0,
        cumulative2.length > 0 ? cumulative2[cumulative2.length - 1].over : 0
    );
    const maxRuns = Math.max(
        cumulative1.length > 0 ? cumulative1[cumulative1.length - 1].total : 0,
        cumulative2.length > 0 ? cumulative2[cumulative2.length - 1].total : 0
    );

    // Generate SVG polyline points
    const generatePoints = (data: { over: number; total: number }[]) => {
        if (data.length === 0) return '';
        return data.map(d => {
            const x = padding.left + (d.over / maxOvers) * chartWidth;
            const y = padding.top + chartHeight - (d.total / maxRuns) * chartHeight;
            return `${x},${y}`;
        }).join(' ');
    };

    const points1 = generatePoints(cumulative1);
    const points2 = generatePoints(cumulative2);

    // Team colors
    const color1 = team1Id ? getTeamColor(parseInt(team1Id)) : '#3b82f6';
    const color2 = team2Id ? getTeamColor(parseInt(team2Id)) : '#ef4444';

    // Y-axis ticks
    const yTicks = [0, Math.round(maxRuns / 2), maxRuns];

    // X-axis ticks (every 5 overs)
    const xTicks: number[] = [];
    for (let i = 5; i <= maxOvers; i += 5) {
        xTicks.push(i);
    }

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            padding: '16px 20px',
            border: '1px solid var(--border-color)',
        }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
                Run Comparison
            </div>

            <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
                {/* Grid lines */}
                {yTicks.map(tick => {
                    const y = padding.top + chartHeight - (tick / maxRuns) * chartHeight;
                    return (
                        <g key={tick}>
                            <line
                                x1={padding.left}
                                y1={y}
                                x2={width - padding.right}
                                y2={y}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth={1}
                            />
                            <text
                                x={padding.left - 8}
                                y={y + 4}
                                fill="rgba(255,255,255,0.4)"
                                fontSize={9}
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
                            key={tick}
                            x={x}
                            y={height - 8}
                            fill="rgba(255,255,255,0.4)"
                            fontSize={9}
                            textAnchor="middle"
                        >
                            {tick}
                        </text>
                    );
                })}

                {/* Innings 1 Line (Team batting first) */}
                {points1 && (
                    <polyline
                        points={points1}
                        fill="none"
                        stroke={color1}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {/* Innings 2 Line (Team batting second) */}
                {points2 && (
                    <polyline
                        points={points2}
                        fill="none"
                        stroke={color2}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="4,3"
                    />
                )}
            </svg>

            {/* Legend */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 20,
                marginTop: 8,
                fontSize: 11,
            }}>
                {cumulative1.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 16, height: 3, background: color1, borderRadius: 2 }} />
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                            {team1Name.split(' ').slice(0, 2).join(' ')} ({cumulative1[cumulative1.length - 1]?.total || 0})
                        </span>
                    </div>
                )}
                {cumulative2.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 16, height: 3, background: color2, borderRadius: 2, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, var(--bg-card) 3px, var(--bg-card) 5px)' }} />
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                            {team2Name.split(' ').slice(0, 2).join(' ')} ({cumulative2[cumulative2.length - 1]?.total || 0})
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WormChart;
