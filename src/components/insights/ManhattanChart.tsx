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

    // Auto-scroll to Current Over (Right Snap - Focused on Latest Innings)
    useLayoutEffect(() => {
        if (!scrollRef.current) return;

        // 1. Find the "Primary Focus Dataset" (Highest ID = Latest Innings)
        // In 2nd innings chase (IDs: [1, 2]), we want to focus on ID 2's progress.
        const sortedDatasets = [...datasets].sort((a, b) => b.id - a.id);
        const primaryDataset = sortedDatasets[0];

        if (!primaryDataset) return;

        // 2. Find the last over that has data *specifically for the primary dataset*
        let primaryMaxOver = 0;
        primaryDataset.data.Overbyover.forEach(o => {
            if (o.Over > primaryMaxOver) primaryMaxOver = o.Over;
        });

        // If primary dataset has no data (e.g. over 0.0), default to 0
        if (primaryMaxOver === 0) {
            scrollRef.current.scrollLeft = 0;
            return;
        }

        // 3. Calculate pixel position of that over
        // Per render logic:
        // groupWidth = 28px (width) + 4px (marginRight) = 32px per unit
        // paddingLeft = 24px
        const groupWidth = 32;
        const paddingLeft = 24;

        // Right edge of the target item
        const itemRightEdge = (primaryMaxOver * groupWidth) + paddingLeft;

        // Container visible width
        const containerWidth = scrollRef.current.clientWidth;

        // 4. Scroll so itemRightEdge is at container's right edge (minus some padding)
        const targetScroll = itemRightEdge - containerWidth + 20;

        // Clamp
        scrollRef.current.scrollLeft = Math.max(0, targetScroll);

    }, [datasets, maxOvers]); // Trigger when data updates

    const chartHeight = 200; // Increased for better resolution and spacing

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
            padding: '24px 20px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
        }}>
            {/* Legend / Filter Row - Styled as Premium Pills */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
                {inningsTabs.map((tab: any) => (
                    <button
                        key={tab.id}
                        onClick={() => onInningsToggle(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 14px',
                            borderRadius: 20,
                            background: tab.isActive ? `rgba(255,255,255,0.08)` : 'transparent',
                            border: `1px solid ${tab.isActive ? tab.color : 'rgba(255,255,255,0.1)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: tab.isActive ? 1 : 0.5
                        }}
                    >
                        <div style={{
                            width: 8, height: 8,
                            borderRadius: '50%',
                            background: tab.color,
                            boxShadow: tab.isActive ? `0 0 8px ${tab.color}40` : 'none'
                        }} />

                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Header: Title */}
            <h4 style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1 }}>
                Innings Progression
            </h4>


            {/* Chart Area */}
            <div style={{ position: 'relative', height: chartHeight }}>

                {/* 1. Y-Axis Grid Lines (Background) */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 24,
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
                                borderTop: val === 0 ? '1px solid rgba(255,255,255,0.1)' : '1px dashed rgba(255,255,255,0.05)',
                                display: 'flex', alignItems: 'flex-end'
                            }}>
                                {val > 0 && (
                                    <span style={{
                                        position: 'absolute', left: 0, bottom: 4,
                                        fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500,
                                        fontFeatureSettings: '"tnum"'
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
                        paddingLeft: 24, // Space for Y-axis labels
                        alignItems: 'flex-end',
                        scrollBehavior: 'smooth'
                    }}
                >
                    {Array.from({ length: maxOvers }).map((_, i) => {
                        const overNum = i + 1;
                        const items = overMap[overNum] || [];
                        const groupWidth = 28; // Slightly wider for better separation

                        // Determine bar width based on number of innings per over
                        const barWidth = items.length > 1 ? (Math.floor((groupWidth - 4) / items.length)) : 16;
                        const gapBetweenBars = 2;

                        return (
                            <div key={overNum} style={{
                                flex: `0 0 ${groupWidth}px`,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                position: 'relative',
                                marginRight: 4, // Spacing between over groups
                                paddingBottom: 24 // Space for X-axis labels
                            }}>
                                {/* Bars Group */}
                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: gapBetweenBars, height: '100%' }}>
                                    {items.map((item, idx) => {
                                        // Height capped at 100% (25 runs)
                                        const rawHeight = (item.runs / 25) * 100;
                                        // Ensure a minimum height so 0 runs is still faintly visible or just defined by base
                                        const safeHeight = Math.max(rawHeight, 2);
                                        const finalHeight = Math.min(safeHeight, 100);

                                        const isWicket = item.wickets > 0;

                                        return (
                                            <div key={idx} style={{
                                                width: barWidth,
                                                height: '100%', // Container is full height for vertical alignment
                                                display: 'flex',
                                                alignItems: 'flex-end',
                                                position: 'relative'
                                            }}>
                                                {/* The Actual Bar */}
                                                <div style={{
                                                    width: '100%',
                                                    height: `${finalHeight}%`,
                                                    background: item.color,
                                                    borderRadius: '4px 4px 1px 1px',
                                                    opacity: 0.9,
                                                    position: 'relative',
                                                    transition: 'height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                                }}>
                                                    {/* Wicket Marker - Placed on top of bar */}
                                                    {isWicket && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: -10, // Float above bar
                                                            left: '50%',
                                                            transform: 'translateX(-50%)',
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            background: '#ef4444',
                                                            border: '2px solid var(--bg-card)',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                                            zIndex: 2
                                                        }} />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* X-Axis Label */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    fontSize: 10,
                                    fontWeight: (overNum % 5 === 0) ? 600 : 400,
                                    color: (overNum % 5 === 0) ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                                    textAlign: 'center',
                                    width: '100%',
                                    marginTop: 6
                                }}>
                                    {overNum}
                                </div>
                            </div>
                        );
                    })}
                    <div style={{ flex: '0 0 20px' }} />
                </div>
            </div>
        </div >
    );
};

export default ManhattanChart;
