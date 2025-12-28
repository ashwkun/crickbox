import React, { useState, useEffect, useMemo } from 'react';
import { BatsmanSplitsResponse, OverByOverResponse } from '../../utils/h2hApi';
import WikiImage from '../WikiImage';
import { IoInformationCircleOutline, IoClose } from 'react-icons/io5';

interface BatsmanBowlerMatchupsProps {
    batsmanSplits: BatsmanSplitsResponse | null;
    overByOver?: OverByOverResponse | null;
    scorecard?: any;
    selectedInnings?: number;
    onInningsChange?: (innings: number) => void;
    isLoading?: boolean;
}

const BatsmanBowlerMatchups: React.FC<BatsmanBowlerMatchupsProps> = ({ batsmanSplits, overByOver, scorecard, selectedInnings = 1, onInningsChange, isLoading = false }) => {
    const [selectedBatterId, setSelectedBatterId] = useState<string | null>(null);
    const [showInfo, setShowInfo] = useState(false);

    const batsmen = batsmanSplits?.Batsmen || {};

    // Filter and Sort Batters
    const batterIds = useMemo(() => {
        return Object.keys(batsmen)
            .filter(id => {
                // Filter out batters with no matchups (didn't bat or no data)
                const data = batsmen[id];
                return data.Against && Object.keys(data.Against).length > 0;
            })
            .sort((a, b) => {
                // Sort by Total Runs (Calculated)
                const getRuns = (id: string) => {
                    return Object.values(batsmen[id].Against || {}).reduce((sum, vs) => sum + (parseInt(vs.Runs) || 0), 0);
                };
                return getRuns(b) - getRuns(a);
            });
    }, [batsmen]);

    // Auto-select first batter on load or when list changes
    useEffect(() => {
        if (batterIds.length > 0) {
            // If currently selected batter is not in the new list, reset to first
            if (!selectedBatterId || !batterIds.includes(selectedBatterId)) {
                setSelectedBatterId(batterIds[0]);
            }
        } else {
            setSelectedBatterId(null);
        }
    }, [batterIds, selectedInnings]);

    const selectedBatterData = selectedBatterId ? batsmen[selectedBatterId] : null;

    // Derived Wicket Map: [BatterID][BowlerID] = count
    // Uses OverByOver data since BatsmanSplits API lacks Dismissals field
    const wicketMap = useMemo(() => {
        const map: Record<string, Record<string, number>> = {};
        if (!overByOver?.Overbyover) return map;

        overByOver.Overbyover.forEach(over => {
            if (parseInt(over.Wickets || '0') > 0 && over.Batsmen && over.Bowlers) {
                // Find Bowler ID (Top bowler in over usually, or just iterate)
                // In OverByOver, Bowlers is a map. Usually only 1 bowler per over.
                const bowlerIds = Object.keys(over.Bowlers);
                const bowlerId = bowlerIds.length > 0 ? bowlerIds[0] : null;

                if (bowlerId) {
                    // Check for Out Batsman
                    Object.entries(over.Batsmen).forEach(([batterId, stats]) => {
                        if (stats.Isout) {
                            if (!map[batterId]) map[batterId] = {};
                            if (!map[batterId][bowlerId]) map[batterId][bowlerId] = 0;
                            map[batterId][bowlerId]++;
                        }
                    });
                }
            }
        });
        return map;
    }, [overByOver]);


    // Helper to determine Verdict Badge - with clearer labels
    const getVerdict = (runs: number, balls: number, dots: number, wickets: number, sr: number) => {
        if (wickets > 0) return { label: 'BOWLER WON', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', description: 'Bowler took the wicket' };
        if (sr > 175 || (runs > 20 && sr > 150)) return { label: 'BATTER DOMINATED', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', description: 'High Strike Rate or Aggressive Scoring' };
        if (dots > 3 && (dots / balls) > 0.6) return { label: 'PINNED DOWN', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', description: 'Struggling to rotate strike (>60% Dots)' };
        if (sr < 100 && balls > 6) return { label: 'SLOW GOING', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', description: 'Scoring below a run-a-ball' };
        return { label: 'NEUTRAL BATTLE', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', description: 'Balanced contest so far' };
    };

    const innings = scorecard?.Innings || [];

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Legend / Info Modal */}
            {showInfo && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 10,
                    background: 'rgba(0,0,0,0.95)',
                    padding: 20,
                    display: 'flex', flexDirection: 'column', gap: 12,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Verdict Guide</div>
                        <IoClose onClick={() => setShowInfo(false)} style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }} />
                    </div>
                    {[
                        { label: 'BATTER DOMINATED', color: '#22c55e', desc: 'Strike Rate 175+ or 20+ runs at quick pace' },
                        { label: 'BOWLER WON', color: '#ef4444', desc: 'Bowler took the wicket' },
                        { label: 'PINNED DOWN', color: '#eab308', desc: 'More than 60% dot balls faced' },
                        { label: 'SLOW GOING', color: '#f97316', desc: 'Scoring rate is low (<100 SR)' },
                        { label: 'NEUTRAL BATTLE', color: 'rgba(255,255,255,0.5)', desc: 'Standard play without one-sided dominance' },
                    ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{
                                fontSize: 9, fontWeight: 800, padding: '4px 8px', borderRadius: 4,
                                color: item.color, background: 'rgba(255,255,255,0.05)',
                                minWidth: 110, textAlign: 'center'
                            }}>{item.label}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{item.desc}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Innings Tabs */}
            {innings.length > 0 && onInningsChange && (
                <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {innings.map((inn: any, idx: number) => {
                        const inningsNum = idx + 1;
                        const isSelected = selectedInnings === inningsNum;
                        return (
                            <button
                                key={idx}
                                onClick={() => onInningsChange(inningsNum)}
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
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'inherit',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {scorecard?.Teams?.[inn.Battingteam]?.Name_Short || `INN ${inningsNum}`}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Heading & Info */}
            <div style={{ padding: '16px 16px 12px', textAlign: 'center', position: 'relative' }}>
                <div
                    onClick={() => setShowInfo(true)}
                    style={{ position: 'absolute', right: 16, top: 16, cursor: 'pointer', opacity: 0.7 }}
                >
                    <IoInformationCircleOutline size={18} color="#fff" />
                </div>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                    Batter vs Bowler
                </h4>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    Matchup Verdicts
                </div>
            </div>

            {/* Loading / Content */}
            <div style={{ position: 'relative', opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>

                {/* 1. BATTER SELECTION */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px 8px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                    <span>Select Batter</span>
                </div>

                <div className="hide-scrollbar" style={{
                    display: 'flex',
                    gap: 12,
                    overflowX: 'auto',
                    padding: '0 16px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                    {batterIds.length > 0 ? batterIds.map((id) => {
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
                    }) : (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: 10, width: '100%', textAlign: 'center' }}>
                            {isLoading ? 'Loading...' : 'No data'}
                        </div>
                    )}
                </div>

                {/* 2. MATCHUP LIST */}
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedBatterData && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                                Vs Bowler
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                                Outcome
                            </div>
                        </div>
                    )}

                    {selectedBatterData && Object.entries(selectedBatterData.Against || {})
                        .sort((a, b) => parseInt(b[1].Balls) - parseInt(a[1].Balls))
                        .filter(([_, vs]) => parseInt(vs.Balls) > 0)
                        .map(([bowlerId, vs]) => {
                            const runs = parseInt(vs.Runs) || 0;
                            const balls = parseInt(vs.Balls) || 0;
                            const dots = parseInt(vs.Dots) || 0;
                            const fours = parseInt(vs.Fours) || 0;
                            const sixes = parseInt(vs.Sixes) || 0;

                            // Get derived wickets from map + API fallback if ever added
                            const derivedWickets = wicketMap[selectedBatterId!]?.[bowlerId] || 0;
                            const apiWickets = parseInt(vs.Dismissals || '0') || 0;
                            const wickets = Math.max(derivedWickets, apiWickets);

                            const sr = parseFloat(vs.Strikerate) || 0;

                            const verdict = getVerdict(runs, balls, dots, wickets, sr);

                            // Dynamic Highlight Text
                            let highlightText = '';
                            if (wickets > 0) highlightText = 'WICKET';
                            else if (runs === 0 && balls > 0) highlightText = `${dots} Dots`; // Duck logic fix
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
                                    border: wickets > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.05)'
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
                                            {/* Verdict Badge */}
                                            <div style={{
                                                fontSize: 8,
                                                fontWeight: 800,
                                                padding: '3px 6px',
                                                borderRadius: 4,
                                                background: verdict.bg,
                                                color: verdict.color,
                                                letterSpacing: 0.5,
                                                textTransform: 'uppercase'
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
                            No matchups available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BatsmanBowlerMatchups;
