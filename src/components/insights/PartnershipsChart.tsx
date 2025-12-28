import React, { useState, useEffect } from 'react';
import WikiImage from '../WikiImage';

interface PartnershipsChartProps {
    scorecard: any;
}

const PartnershipsChart: React.FC<PartnershipsChartProps> = ({ scorecard }) => {
    // State for selected innings (0-indexed internally, but buttons use 1-based display)
    // Initialize to last innings (current)
    const [selectedInningsIdx, setSelectedInningsIdx] = useState<number>(0);

    const innings = scorecard?.Innings || [];

    // Auto-select last innings on load
    useEffect(() => {
        if (innings.length > 0) {
            setSelectedInningsIdx(innings.length - 1);
        }
    }, [innings.length]);

    if (innings.length === 0) return null;

    const selectedInn = innings[selectedInningsIdx];
    const partnerships = selectedInn?.Partnerships || [];

    // Filter valid partnerships
    const validPartnerships = partnerships.filter((p: any) => (parseInt(p.Runs) || 0) > 0);

    if (validPartnerships.length === 0) return null;

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header / Tabs - Copied from WagonWheel style */}
            {innings.length > 0 && (
                <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {innings.map((inn: any, idx: number) => {
                        const isSelected = selectedInningsIdx === idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedInningsIdx(idx)}
                                style={{
                                    flex: 1,
                                    minWidth: 70,
                                    padding: '10px 12px',
                                    border: 'none',
                                    background: isSelected ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                                    borderBottom: isSelected ? '2px solid #22c55e' : '2px solid transparent',
                                    color: isSelected ? '#22c55e' : 'rgba(255,255,255,0.6)',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'inherit',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {scorecard?.Teams?.[inn.Battingteam]?.Name_Short || `INN ${idx + 1}`}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Title */}
            <h4 style={{ margin: '12px 16px 8px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Partnerships</h4>

            {/* Partnership List - Compact Vertical Layout */}
            <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {validPartnerships.map((p: any, idx: number) => {
                    const totalRuns = parseInt(p.Runs) || 1;
                    const bat1 = p.Batsmen?.[0];
                    const bat2 = p.Batsmen?.[1];
                    const bat1Runs = parseInt(bat1?.Runs) || 0;
                    const bat1Balls = parseInt(bat1?.Balls) || 0;
                    const bat2Runs = parseInt(bat2?.Runs) || 0;
                    const bat2Balls = parseInt(bat2?.Balls) || 0;
                    const bat1Pct = totalRuns > 0 ? (bat1Runs / totalRuns) * 100 : 50;

                    // Name handling - use full name but ensure it can wrap if needed, otherwise rely on flex
                    const bat1Name = bat1?.name || scorecard.Teams?.[selectedInn.Battingteam]?.Players?.[bat1?.Batsman]?.Name_Full || 'P1';
                    const bat2Name = bat2?.name || scorecard.Teams?.[selectedInn.Battingteam]?.Players?.[bat2?.Batsman]?.Name_Full || 'P2';

                    const isLatestInnings = selectedInningsIdx === innings.length - 1;
                    const isCurrent = isLatestInnings && (p.Isunbeaten === 'true' || p.Isunbeaten === true);

                    return (
                        <div key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px',
                            background: isCurrent ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255,255,255,0.02)',
                            borderRadius: 12,
                            border: isCurrent ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.04)',
                        }}>
                            {/* Player 1 Section (Stacked) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0, textAlign: 'center' }}>
                                <WikiImage name={bat1Name} id={bat1?.Batsman} type="player" style={{ width: 36, height: 36, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 4 }} circle={true} />
                                <div style={{ fontSize: 10, fontWeight: 600, color: '#fff', lineHeight: '1.2', marginBottom: 2, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {bat1Name}
                                </div>
                                <div style={{ fontSize: 10, color: '#60a5fa', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                    <span style={{ fontWeight: 700 }}>{bat1Runs}</span>
                                    <span style={{ opacity: 0.6 }}> ({bat1Balls})</span>
                                </div>
                            </div>

                            {/* Center Bar */}
                            <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 50 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: isCurrent ? '#22c55e' : '#fff', lineHeight: 1 }}>
                                    {p.Runs}
                                </div>

                                <div style={{ width: '100%', height: 5, borderRadius: 2.5, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{ width: `${bat1Pct}%`, background: '#60a5fa', height: '100%' }} />
                                    <div style={{ width: `${100 - bat1Pct}%`, background: '#f97316', height: '100%' }} />
                                </div>

                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                                    {p.Balls}b
                                </div>
                            </div>

                            {/* Player 2 Section (Stacked) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0, textAlign: 'center' }}>
                                <WikiImage name={bat2Name} id={bat2?.Batsman} type="player" style={{ width: 36, height: 36, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 4 }} circle={true} />
                                <div style={{ fontSize: 10, fontWeight: 600, color: '#fff', lineHeight: '1.2', marginBottom: 2, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {bat2Name}
                                </div>
                                <div style={{ fontSize: 10, color: '#f97316', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                    <span style={{ fontWeight: 700 }}>{bat2Runs}</span>
                                    <span style={{ opacity: 0.6 }}> ({bat2Balls})</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PartnershipsChart;
