import React, { useMemo, useRef, useLayoutEffect } from 'react';
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
    const scrollRef = useRef<HTMLDivElement>(null);

    // Determine the max overs across all selected datasets
    const maxOvers = useMemo(() => {
        let max = 20; // Default minimum
        datasets.forEach(d => {
            const lastOver = d.data.Overbyover[d.data.Overbyover.length - 1]?.Over || 0;
            if (lastOver > max) max = lastOver;
        });
        return Math.max(max, 5);
    }, [datasets]);

    // Auto-scroll to the right (latest overs) when data changes
    useLayoutEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [maxOvers, datasets.length]); // Trigger on structure change

    const chartHeight = 150;

    // Helper to get tab label (standardized)
    const getTabLabel = (idx: number, teamId: string) => {
        const team = scorecard?.Teams?.[teamId];
        return `${team?.Name_Short || 'TM'} ${Math.floor(idx / 2) + 1}`;
    };

    // Helper to get team color for the toggle dot (if not selected)
    // We can try to use the dataset color if available, or fallback
    const getTabColor = (id: number) => {
        const ds = datasets.find(d => d.id === id);
        return ds?.color || 'var(--text-muted)';
    };

    // Sort innings tabs by order
    const inningsTabs = scorecard?.Innings?.map((inn: any, idx: number) => {
        const id = idx + 1;
        const color = getTabColor(id);
        return {
            id,
            label: getTabLabel(idx, inn.Battingteam),
            isActive: selectedInnings.includes(id),
            color
        };
    }) || [];

    // Process data for rendering
    const overMap = useMemo(() => {
        const map: Record<number, { runs: number, wickets: number, color: string, label: string }[]> = {};
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
            padding: '20px 16px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
        }}>
            {/* Header & Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: 1.2
                }}>
                    <div style={{ width: 4, height: 14, background: '#3b82f6', borderRadius: 2 }} />
                    Comparison by Over
                </div>

                {/* Multi-Select Chips */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {inningsTabs.map((tab: any) => (
                        <button
                            key={tab.id}
                            onClick={() => onInningsToggle(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px',
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                // Active: Team Color Background | Inactive: Darker Background
                                background: tab.isActive ? tab.color : 'rgba(255,255,255,0.05)',
                                color: tab.isActive ? '#fff' : 'var(--text-muted)',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: tab.isActive ? `0 4px 12px -2px ${tab.color}40` : 'none',
                                border: tab.isActive ? `1px solid ${tab.color}` : '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            {/* Dot is always visible in inactive state to show potential color */}
                            {!tab.isActive && (
                                <div style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: tab.color, opacity: 0.7
                                }} />
                            )}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div
                ref={scrollRef}
                className="hide-scrollbar"
                style={{
                    overflowX: 'auto',
                    display: 'flex',
                    alignItems: 'flex-end',
                    height: chartHeight,
                    paddingBottom: 24, // Axis labels
                    paddingTop: 10,
                    gap: 8, // Wider spacing between over groups for clarity
                    scrollBehavior: 'smooth'
                }}
            >
                {Array.from({ length: maxOvers }).map((_, i) => {
                    const overNum = i + 1;
                    const items = overMap[overNum] || [];

                    // Group width logic
                    const groupWidth = 16; // Slightly wider base
                    // If multiple items, split the width
                    const barWidth = items.length > 1 ? (groupWidth / items.length) - 1 : 10;

                    return (
                        <div key={overNum} style={{
                            flex: `0 0 ${Math.max(groupWidth, 16)}px`,
                            height: '100%',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            position: 'relative',
                            gap: 1
                        }}>
                            {/* Bars */}
                            {items.map((item, idx) => {
                                // Dynamic Height: Max 25 runs = 100%
                                const barHeight = Math.min(Math.max((item.runs / 25) * 100, 4), 100);

                                // Special Colors
                                const isWicket = item.wickets > 0;
                                const isHighScore = item.runs >= 10;
                                const bg = isWicket ? '#ef4444' : isHighScore ? '#22c55e' : item.color;

                                return (
                                    <div key={idx} style={{
                                        width: barWidth,
                                        height: `${barHeight}%`,
                                        background: bg,
                                        // Visual Polish: Rounded Tops only
                                        borderRadius: '3px 3px 0 0',
                                        position: 'relative',
                                        transition: 'all 0.3s ease',
                                        opacity: (isWicket || isHighScore) ? 1 : 0.85
                                    }}>
                                        {/* Wicket Indicator (Floating Dot) */}
                                        {isWicket && (
                                            <div style={{
                                                position: 'absolute',
                                                top: -8,
                                                left: '50%', transform: 'translateX(-50%)',
                                                width: 5, height: 5,
                                                borderRadius: '50%',
                                                background: '#ef4444',
                                                boxShadow: '0 0 0 2px var(--bg-card)'
                                            }} />
                                        )}
                                    </div>
                                );
                            })}

                            {/* Axis Label (Every 5 overs + Last one if needed) */}
                            {(overNum % 5 === 0 || overNum === 1) && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: -24,
                                    fontSize: 9,
                                    color: 'rgba(255,255,255,0.4)',
                                    fontWeight: 600,
                                    letterSpacing: 0.5
                                }}>
                                    {overNum}
                                </div>
                            )}

                            {/* Subtle Grid Line for 5s */}
                            {overNum % 5 === 0 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: '50%',
                                    width: 1,
                                    height: '100%',
                                    background: 'rgba(255,255,255,0.03)',
                                    pointerEvents: 'none'
                                }} />
                            )}
                        </div>
                    );
                })}

                {/* Padding at end to ensure last label is visible */}
                <div style={{ flex: '0 0 10px' }} />
            </div>
        </div>
    );
};

export default ManhattanChart;
