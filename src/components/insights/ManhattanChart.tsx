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

    const chartHeight = 180; // Increased for better resolution

    // Helper to get tab label (standardized)
    const getTabLabel = (idx: number, teamId: string) => {
        const team = scorecard?.Teams?.[teamId];
        return `${team?.Name_Short || 'TM'} ${Math.floor(idx / 2) + 1}`;
    };

    // Helper: color for inactive tabs
    const getTabColor = (id: number) => {
        const ds = datasets.find(d => d.id === id);
        return ds?.color || 'var(--text-muted)';
    };

    // Tabs / Legend Items
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
            padding: '20px 20px 24px 20px', // Extra bottom padding
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Header: Title & Filter/Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: 1.2
                    }}>
                        <div style={{ width: 4, height: 14, background: '#3b82f6', borderRadius: 2 }} />
                        Runs per Over
                    </div>
                </div>

                {/* Legend / Filter Row - Styled as Checkboxes */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {inningsTabs.map((tab: any) => (
                        <button
                            key={tab.id}
                            onClick={() => onInningsToggle(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 12px',
                                borderRadius: 8,
                                background: 'rgba(255,255,255,0.03)',
                                border: `1px solid ${tab.isActive ? tab.color : 'rgba(255,255,255,0.1)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: tab.isActive ? 1 : 0.6
                            }}
                        >
                            {/* Checkbox Visual */}
                            <div style={{
                                width: 14, height: 14,
                                borderRadius: 3,
                                background: tab.isActive ? tab.color : 'transparent',
                                border: `1px solid ${tab.isActive ? tab.color : 'rgba(255,255,255,0.3)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {tab.isActive && (
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>

                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Area */}
            <div style={{ position: 'relative', height: chartHeight }}>

                {/* 1. Y-Axis Grid Lines (Background) */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 20,
                    pointerEvents: 'none', zIndex: 0
                }}>
                    {[0, 6, 12, 18, 24].map((val) => {
                        const bottomPct = (val / 25) * 100;
                        if (bottomPct > 100) return null;
                        return (
                            <div key={val} style={{
                                position: 'absolute',
                                left: 0, right: 0,
                                bottom: `${bottomPct}%`,
                                height: 1,
                                background: val === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                                display: 'flex', alignItems: 'flex-end' // align label
                            }}>
                                {val > 0 && (
                                    <span style={{
                                        position: 'absolute', left: 0, bottom: 2,
                                        fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 500
                                    }}>
                                        {val}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 2. Scrollable Bars Area */}
                <div
                    ref={scrollRef}
                    className="hide-scrollbar"
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        overflowX: 'auto',
                        display: 'flex',
                        height: '100%',
                        paddingLeft: 20, // Space for grid labels
                        paddingTop: 10,
                        alignItems: 'flex-end',
                        scrollBehavior: 'smooth'
                    }}
                >
                    {Array.from({ length: maxOvers }).map((_, i) => {
                        const overNum = i + 1;
                        const items = overMap[overNum] || [];
                        const groupWidth = 24; // Standard width per over

                        // Maintain spacing for missing items (alignment)
                        const barWidth = items.length > 1 ? (Math.floor(groupWidth / items.length) - 2) : 12;

                        return (
                            <div key={overNum} style={{
                                flex: `0 0 ${groupWidth}px`,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                position: 'relative',
                                marginLeft: 8 // Gap between groups
                            }}>
                                {/* Bars */}
                                <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: '100%', paddingBottom: 20 }}>
                                    {items.map((item, idx) => {
                                        // Height capped at 100% (25 runs)
                                        const rawHeight = (item.runs / 25) * 100;
                                        const safeHeight = Math.min(Math.max(rawHeight, 2), 100);

                                        const isWicket = item.wickets > 0;
                                        const isHighScore = item.runs >= 10;

                                        // Gradient Logic
                                        const baseColor = isWicket ? '#ef4444' : isHighScore ? '#22c55e' : item.color;
                                        // Darken slightly for bottom of gradient
                                        // We can just use an overlay gradient

                                        return (
                                            <div key={idx} style={{
                                                width: barWidth,
                                                height: `${safeHeight}%`,
                                                background: `linear-gradient(180deg, ${baseColor} 0%, ${baseColor}90 100%)`,
                                                borderRadius: '2px 2px 0 0',
                                                position: 'relative',
                                                transition: 'height 0.3s ease'
                                            }}>
                                                {/* Wicket Indicator */}
                                                {isWicket && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: -8, left: '50%', transform: 'translateX(-50%)',
                                                        width: 6, height: 6, borderRadius: '50%',
                                                        background: '#ef4444',
                                                        border: '1px solid var(--bg-card)',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                                    }} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* X-Axis Label */}
                                {(overNum % 5 === 0 || overNum === 1) && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: 'rgba(255,255,255,0.4)'
                                    }}>
                                        {overNum}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <div style={{ flex: '0 0 20px' }} />
                </div>
            </div>
        </div>
    );
};

export default ManhattanChart;
