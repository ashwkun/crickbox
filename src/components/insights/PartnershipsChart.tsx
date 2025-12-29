import React, { useState, useEffect } from 'react';
import WikiImage from '../WikiImage';

interface PartnershipsChartProps {
    scorecard: any;
    selectedInnings?: number;
    onInningsChange?: (innings: number) => void;
}

const PartnershipsChart: React.FC<PartnershipsChartProps> = ({ scorecard, selectedInnings = 1, onInningsChange }) => {
    // State lifted to parent

    const innings = scorecard?.Innings || [];

    // Create empty state component
    const EmptyState = ({ message }: { message: string }) => (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            border: '1px solid var(--border-color)',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
        }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{message}</span>
        </div>
    );

    if (innings.length === 0) return <EmptyState message="No innings data available" />;

    // Convert 1-based prop to 0-based index for data access
    const selectedInningsIdx = selectedInnings - 1;
    const selectedInn = innings[selectedInningsIdx];
    const partnerships = selectedInn?.Partnerships || [];

    // Filter valid partnerships
    const validPartnerships = partnerships.filter((p: any) => (parseInt(p.Runs) || 0) > 0);

    if (validPartnerships.length === 0) return <EmptyState message="No partnership data for this innings" />;

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
                                onClick={() => onInningsChange?.(idx + 1)}
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
                                {scorecard?.Teams?.[inn.Battingteam]?.Name_Short} {Math.floor(idx / 2) + 1}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Title */}
            <h4 style={{ margin: '12px 16px 8px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', textAlign: 'center' }}>Partnerships</h4>

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
                            <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 50 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: isCurrent ? '#22c55e' : '#fff', lineHeight: 1, whiteSpace: 'nowrap' }}>
                                    {p.Runs} <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, color: isCurrent ? '#fff' : 'rgba(255,255,255,0.5)' }}>({p.Balls})</span>
                                </div>

                                <div style={{ width: '100%', height: 5, borderRadius: 2.5, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{ width: `${bat1Pct}%`, background: '#60a5fa', height: '100%' }} />
                                    <div style={{ width: `${100 - bat1Pct}%`, background: '#f97316', height: '100%' }} />
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
