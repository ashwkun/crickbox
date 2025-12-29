import React, { useMemo } from 'react';
import { OverByOverResponse } from '../../utils/h2hApi';

interface ManhattanDataset {
    data: OverByOverResponse;
    label: string;
    color: string;
    id: number;
}

interface ManhattanChartProps {
    datasets: ManhattanDataset[];
    scorecard: any;
    selectedInnings: number[];
    onInningsToggle: (innings: number) => void;
}

const ManhattanChart: React.FC<ManhattanChartProps> = ({
    datasets,
    scorecard,
    selectedInnings,
    onInningsToggle
}) => {
    // Determine the max overs across all selected datasets to set the X-axis range
    const maxOvers = useMemo(() => {
        let max = 20; // Default minimum
        datasets.forEach(d => {
            const lastOver = d.data.Overbyover[d.data.Overbyover.length - 1]?.Over || 0;
            if (lastOver > max) max = lastOver;
        });
        // Limit to 20 for T20, 50 for ODI, or just use runs max
        return Math.max(max, 5); // Ensure at least some width
    }, [datasets]);

    const chartHeight = 160;

    // Helper to get tab label (standardized)
    const getTabLabel = (idx: number, teamId: string) => {
        const team = scorecard?.Teams?.[teamId];
        return `${team?.Name_Short || 'TM'} ${Math.floor(idx / 2) + 1}`;
    };

    // Sort innings tabs by order
    const inningsTabs = scorecard?.Innings?.map((inn: any, idx: number) => {
        const id = idx + 1;
        return {
            id,
            label: getTabLabel(idx, inn.Battingteam),
            isActive: selectedInnings.includes(id)
        };
    }) || [];

    // Process data for rendering
    // We need to group runs by Over.
    // overMap[1] = [ { runs: 5, color: 'blue' }, { runs: 8, color: 'red' } ]
    const overMap = useMemo(() => {
        const map: Record<number, { runs: number, wickets: number, color: string, label: string }[]> = {};

        // Populate
        datasets.forEach(ds => {
            ds.data.Overbyover.forEach(o => {
                if (!map[o.Over]) map[o.Over] = [];
                map[o.Over].push({
                    runs: parseInt(o.Runs) || 0,
                    wickets: parseInt(o.Wickets) || 0,
                    color: ds.color,
                    label: ds.label
                });
            });
        });
        return map;
    }, [datasets]);

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            padding: '16px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
        }}>
            {/* Header & Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Innings Progression
                </div>

                {/* Multi-Select Tabs */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {inningsTabs.map((tab: any) => (
                        <button
                            key={tab.id}
                            onClick={() => onInningsToggle(tab.id)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                background: tab.isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: tab.isActive ? '#fff' : 'var(--text-muted)',
                                transition: 'all 0.2s ease',
                                border: tab.isActive ? '1px solid var(--primary-dark)' : '1px solid transparent'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="hide-scrollbar" style={{
                overflowX: 'auto',
                display: 'flex',
                alignItems: 'flex-end',
                height: chartHeight,
                paddingBottom: 20, // Axis labels
                paddingTop: 10,
                gap: 6 // Spacing between over groups
            }}>
                {Array.from({ length: maxOvers }).map((_, i) => {
                    const overNum = i + 1;
                    const items = overMap[overNum] || [];
                    const hasItems = items.length > 0;

                    // Group width logic: fixed width per over group
                    // If 1 item: 12px bar
                    // If 2 items: 6px bar * 2 + 1px gap
                    const groupWidth = 14;
                    const barWidth = items.length > 1 ? (groupWidth / items.length) - 1 : groupWidth;

                    return (
                        <div key={overNum} style={{
                            flex: `0 0 ${Math.max(groupWidth, 14)}px`,
                            height: '100%',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            position: 'relative',
                            gap: 1
                        }}>
                            {/* Bars */}
                            {items.map((item, idx) => {
                                const barHeight = Math.min(Math.max((item.runs / 25) * 100, 4), 100);
                                return (
                                    <div key={idx} style={{
                                        width: barWidth,
                                        height: `${barHeight}%`,
                                        background: item.wickets > 0 ? '#ef4444' : item.runs >= 10 ? '#22c55e' : item.color,
                                        opacity: item.wickets > 0 || item.runs >= 10 ? 1 : 0.8, // Slightly fade normal runs to make colors pop
                                        borderRadius: '2px 2px 0 0',
                                        position: 'relative'
                                    }}>
                                        {/* Wicket Dot */}
                                        {item.wickets > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: -6,
                                                left: '50%', transform: 'translateX(-50%)',
                                                width: 6, height: 6,
                                                borderRadius: '50%',
                                                background: '#ef4444',
                                                border: '1px solid var(--bg-card)'
                                            }} />
                                        )}
                                    </div>
                                );
                            })}

                            {/* Axis Label (Every 5) */}
                            {overNum % 5 === 0 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: -20,
                                    fontSize: 9,
                                    color: 'rgba(255,255,255,0.3)',
                                    fontWeight: 500
                                }}>
                                    {overNum}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend (if Multiple) */}
            {selectedInnings.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {datasets.map(d => (
                        <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                            <div style={{ width: 8, height: 8, background: d.color, borderRadius: 2 }} />
                            {d.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManhattanChart;
