import React, { useState, useEffect } from 'react';
import { BatsmanSplitsResponse } from '../../utils/h2hApi';
import WikiImage from '../WikiImage';

interface BatsmanBowlerMatchupsProps {
    batsmanSplits: BatsmanSplitsResponse | null;
}

const BatsmanBowlerMatchups: React.FC<BatsmanBowlerMatchupsProps> = ({ batsmanSplits }) => {
    const [selectedBatterId, setSelectedBatterId] = useState<string | null>(null);

    const batsmen = batsmanSplits?.Batsmen || {};
    const batterIds = Object.keys(batsmen);

    // Auto-select first batter on load
    useEffect(() => {
        if (batterIds.length > 0 && !selectedBatterId) {
            setSelectedBatterId(batterIds[0]);
        }
    }, [batterIds.length, selectedBatterId]);

    if (!batsmanSplits || batterIds.length === 0) return null;

    const selectedBatterData = selectedBatterId ? batsmen[selectedBatterId] : null;

    // Helper to determine Verdict Badge
    const getVerdict = (runs: number, balls: number, dots: number, wickets: number, sr: number) => {
        if (wickets > 0) return { label: 'TROUBLE', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
        if (sr > 175 || (runs > 20 && sr > 150)) return { label: 'DOMINATED', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' };
        if (dots > 3 && (dots / balls) > 0.6) return { label: 'PINNED', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' }; // High dot %
        if (sr < 100 && balls > 6) return { label: 'SLOW', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' };
        return { label: 'NEUTRAL', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)' };
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{ padding: '16px 16px 12px' }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                    Batter vs Bowler
                </h4>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    Live Matchups & Verdicts
                </div>
            </div>

            {/* 1. Batter Tabs (Focus Mode) */}
            <div className="hide-scrollbar" style={{
                display: 'flex',
                gap: 12,
                overflowX: 'auto',
                padding: '0 16px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                {batterIds.map((id) => {
                    const batter = batsmen[id];
                    const isSelected = selectedBatterId === id;
                    return (
                        <div
                            key={id}
                            onClick={() => setSelectedBatterId(id)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 6,
                                cursor: 'pointer',
                                opacity: isSelected ? 1 : 0.5,
                                transition: 'all 0.2s',
                                minWidth: 50
                            }}
                        >
                            <WikiImage
                                name={batter.Batsman}
                                id={id}
                                type="player"
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    border: isSelected ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.1)',
                                    boxShadow: isSelected ? '0 0 10px rgba(34, 197, 94, 0.2)' : 'none'
                                }}
                                circle={true}
                            />
                            <div style={{
                                fontSize: 10,
                                fontWeight: isSelected ? 700 : 500,
                                color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)',
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                maxWidth: 60,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {batter.Batsman.split(' ').pop()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 2. Matchup List for Selected Batter */}
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedBatterData && Object.entries(selectedBatterData.Against || {})
                    .sort((a, b) => parseInt(b[1].Balls) - parseInt(a[1].Balls)) // Sort by balls faced
                    .filter(([_, vs]) => parseInt(vs.Balls) > 0) // Hide empty matchups
                    .map(([bowlerId, vs]) => {
                        const runs = parseInt(vs.Runs) || 0;
                        const balls = parseInt(vs.Balls) || 0;
                        const dots = parseInt(vs.Dots) || 0;
                        const fours = parseInt(vs.Fours) || 0;
                        const sixes = parseInt(vs.Sixes) || 0;
                        const wickets = parseInt(vs.Dismissals) || 0;
                        const sr = parseFloat(vs.Strikerate) || 0;

                        const verdict = getVerdict(runs, balls, dots, wickets, sr);

                        // Dynamic Highlight Text
                        let highlightText = '';
                        if (wickets > 0) highlightText = 'Wicket';
                        else if (fours > 0 || sixes > 0) highlightText = `${fours > 0 ? `${fours}x4 ` : ''}${sixes > 0 ? `${sixes}x6` : ''}`;
                        else if (dots > 2) highlightText = `${dots} Dots`;
                        else highlightText = `SR ${vs.Strikerate}`;

                        return (
                            <div key={bowlerId} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                {/* Bowler Avatar */}
                                <WikiImage
                                    name={vs.Bowler}
                                    id={bowlerId}
                                    type="player"
                                    style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }}
                                    circle={true}
                                />

                                {/* Stats & Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                                            {vs.Bowler}
                                        </div>
                                        {/* Verdict Badge - No Emojis */}
                                        <div style={{
                                            fontSize: 9,
                                            fontWeight: 800,
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            background: verdict.bg,
                                            color: verdict.color,
                                            letterSpacing: 0.5
                                        }}>
                                            {verdict.label}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>
                                            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{runs}</span>
                                            <span style={{ fontSize: 11, opacity: 0.6 }}> ({balls})</span>
                                        </div>

                                        <div style={{ fontSize: 10, color: verdict.color === '#ef4444' ? '#ef4444' : 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                                            {highlightText}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                {(!selectedBatterData || Object.keys(selectedBatterData.Against || {}).length === 0) && (
                    <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        No matchups available yet
                    </div>
                )}
            </div>
        </div>
    );
};

export default BatsmanBowlerMatchups;
