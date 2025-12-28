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
                                    padding: '12px 16px',
                                    border: 'none',
                                    background: isSelected ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                                    borderBottom: isSelected ? '2px solid #22c55e' : '2px solid transparent',
                                    color: isSelected ? '#22c55e' : 'rgba(255,255,255,0.6)',
                                    fontSize: 12,
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

            {/* Title (Optional, but good for context) */}
            <h4 style={{ margin: '16px 16px 10px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Partnerships</h4>

            {/* Partnership List - Copied from LiveDetail */}
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {validPartnerships.map((p: any, idx: number) => {
                    const totalRuns = parseInt(p.Runs) || 1;
                    const bat1 = p.Batsmen?.[0];
                    const bat2 = p.Batsmen?.[1];
                    const bat1Runs = parseInt(bat1?.Runs) || 0;
                    const bat2Runs = parseInt(bat2?.Runs) || 0;
                    const bat1Pct = totalRuns > 0 ? (bat1Runs / totalRuns) * 100 : 50;

                    // Name handling: Try player name directly, or look up in Teams
                    const bat1Name = bat1?.name || scorecard.Teams?.[selectedInn.Battingteam]?.Players?.[bat1?.Batsman]?.Name_Full || 'P1';
                    const bat2Name = bat2?.name || scorecard.Teams?.[selectedInn.Battingteam]?.Players?.[bat2?.Batsman]?.Name_Full || 'P2';

                    // Highlight current partnership if it's the latest innings and unbeaten
                    const isLatestInnings = selectedInningsIdx === innings.length - 1;
                    const isCurrent = isLatestInnings && (p.Isunbeaten === 'true' || p.Isunbeaten === true);

                    return (
                        <div key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                            background: isCurrent ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255,255,255,0.02)',
                            borderRadius: 8,
                            border: isCurrent ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.04)'
                        }}>
                            {/* Wicket # */}
                            <div style={{ fontSize: 10, color: isCurrent ? '#22c55e' : 'rgba(255,255,255,0.4)', fontWeight: 700, minWidth: 18 }}>
                                {p.ForWicket}{isCurrent && '*'}
                            </div>

                            {/* Player 1 */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
                                <WikiImage name={bat1Name} id={bat1?.Batsman} type="player" style={{ width: 24, height: 24 }} circle={true} />
                                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 40 }}>
                                    {bat1Name.split(' ').pop()}
                                </div>
                            </div>
                            <div style={{ fontSize: 10, color: '#60a5fa', fontWeight: 600, minWidth: 20, textAlign: 'center', fontFamily: 'monospace' }}>
                                {bat1Runs}
                            </div>

                            {/* Contribution Bar */}
                            <div style={{ flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.08)' }}>
                                <div style={{ width: `${bat1Pct}%`, background: '#60a5fa', height: '100%' }} />
                                <div style={{ width: `${100 - bat1Pct}%`, background: '#f97316', height: '100%' }} />
                            </div>

                            {/* Player 2 */}
                            <div style={{ fontSize: 10, color: '#f97316', fontWeight: 600, minWidth: 20, textAlign: 'center', fontFamily: 'monospace' }}>
                                {bat2Runs}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
                                <WikiImage name={bat2Name} id={bat2?.Batsman} type="player" style={{ width: 24, height: 24 }} circle={true} />
                                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 40 }}>
                                    {bat2Name.split(' ').pop()}
                                </div>
                            </div>

                            {/* Total */}
                            <div style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? '#22c55e' : '#fff', fontFamily: 'monospace', minWidth: 40, textAlign: 'right' }}>
                                {p.Runs}<span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>({p.Balls})</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PartnershipsChart;
