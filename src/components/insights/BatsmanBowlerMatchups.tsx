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
            // console.log(`[Matchups] Proc Over ${over.Over}, Bowlers: ${Object.keys(over.Bowlers || {}).join(',')}`);

            // We ignore over.Wickets summary and rely on individual Isout flags
            if (over.Batsmen && over.Bowlers) {
                const bowlerIds = Object.keys(over.Bowlers);
                const bowlerId = bowlerIds.length > 0 ? bowlerIds[0] : null;

                if (bowlerId) {
                    Object.entries(over.Batsmen).forEach(([batterId, stats]) => {
                        const isOut = stats.Isout === true || stats.Isout === 'true' || stats.Isout === '1' || stats.Isout === 1;

                        if (isOut) {
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
    const getVerdict = (runs: number, balls: number, dots: number, wickets: number, sr: number, matchType: string = 'T20') => {
        if (wickets > 0) return { label: 'WICKET', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', description: 'Bowler took the wicket' };

        const isTest = matchType.toLowerCase().includes('test') || matchType.toLowerCase().includes('fc') || matchType.toLowerCase().includes('first class');
        const isODI = matchType.toLowerCase().includes('odi') || matchType.toLowerCase().includes('list a') || matchType.toLowerCase().includes('one day');

        let limits = {
            dominateSr: 175,
            dominateRuns: 20,
            dominateRunsSr: 150,
            pinnedDotPct: 0.6,
            slowSr: 100
        };

        if (isTest) {
            limits = { dominateSr: 90, dominateRuns: 30, dominateRunsSr: 75, pinnedDotPct: 0.85, slowSr: 35 };
        } else if (isODI) {
            limits = { dominateSr: 130, dominateRuns: 25, dominateRunsSr: 110, pinnedDotPct: 0.7, slowSr: 75 };
        }

        if (sr > limits.dominateSr || (runs > limits.dominateRuns && sr > limits.dominateRunsSr))
            return { label: 'BATTER DOMINATED', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', description: 'High Strike Rate or Aggressive Scoring' };

        if (dots > 3 && (dots / balls) > limits.pinnedDotPct)
            return { label: 'PINNED DOWN', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', description: 'Struggling to rotate strike' };

        if (sr < limits.slowSr && balls > 6)
            return { label: 'SLOW GOING', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', description: 'Scoring rate is low' };

        return { label: 'NEUTRAL', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', description: 'Balanced contest so far' };
    };

    const innings = scorecard?.Innings || [];
    const matchType = scorecard?.Matchdetail?.Match?.Type || 'T20';

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Header: Title */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 20px 0 20px',
                marginBottom: 16
            }}>
                <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: 1
                }}>
                    Batter vs Bowler Matchups
                </div>

                {/* Info Icon */}
                <button
                    onClick={() => setShowInfo(true)}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 28, height: 28,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.6)'
                    }}
                >
                    <IoInformationCircleOutline size={18} />
                </button>
            </div>

            {/* Legend / Info Modal */}
            {showInfo && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 10,
                    background: 'rgba(0,0,0,0.95)',
                    padding: 24,
                    display: 'flex', flexDirection: 'column', gap: 20,
                    backdropFilter: 'blur(8px)',
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase', borderBottom: '2px solid #22c55e', paddingBottom: 4 }}>
                            Reading the Matchups
                        </div>
                        <IoClose onClick={() => setShowInfo(false)} style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }} />
                    </div>

                    {/* Section 1: The Basics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase' }}>
                            1. The Basics
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: 8, fontSize: 13, color: '#fff', fontFamily: 'monospace' }}>
                            <span style={{ fontWeight: 700 }}>12</span> <span style={{ opacity: 0.6 }}>(8)</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                            This means the batter scored <strong style={{ color: '#fff' }}>12 runs</strong> off <strong style={{ color: '#fff' }}>8 balls</strong> faced from this specific bowler.
                        </div>
                    </div>

                    {/* Section 2: Decoding the Battle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', textTransform: 'uppercase' }}>
                            2. Who is Winning?
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                            We analyze every ball to judge the contest relative to the <strong>Match Format</strong> ({matchType}):
                        </div>

                        {[
                            { label: 'PINNED DOWN', color: '#eab308', desc: 'High dot ball count. Pressure is building.' },
                            { label: 'SLOW GOING', color: '#f97316', desc: 'Scoring rate is below par for this format.' },
                            { label: 'BATTER DOMINATED', color: '#22c55e', desc: 'Aggressive scoring above the format average.' },
                            { label: 'WICKET', color: '#ef4444', desc: 'The bowler won the ultimate contest.' },
                        ].map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <div style={{
                                    fontSize: 8, fontWeight: 800, padding: '3px 6px',
                                    color: item.color, background: 'rgba(255,255,255,0.05)',
                                    borderRadius: 4, minWidth: 90, textAlign: 'center', marginTop: 2
                                }}>{item.label}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', flex: 1, lineHeight: '1.3' }}>{item.desc}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', textAlign: 'center' }}>
                        Tap anywhere to close
                    </div>
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
                                {scorecard?.Teams?.[inn.Battingteam]?.Name_Short} {Math.floor(idx / 2) + 1}
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
                    Matchup Verdicts ({matchType})
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

                            if (derivedWickets > 0) {
                                // console.log(`[Matchups] Render: ${selectedBatterId} vs ${bowlerId} -> Wickets: ${derivedWickets}`);
                            }

                            const sr = parseFloat(vs.Strikerate) || 0;

                            const verdict = getVerdict(runs, balls, dots, wickets, sr, matchType);

                            // Dynamic Highlight Text
                            let highlightContent: React.ReactNode = `SR ${vs.Strikerate}`;
                            if (runs === 0 && balls > 0) highlightContent = `${dots} Dots`;
                            else if (fours > 0 || sixes > 0) highlightContent = `${fours > 0 ? `${fours}x4 ` : ''}${sixes > 0 ? `${sixes}x6` : ''}`;
                            else if (dots > 2) highlightContent = `${dots} Dots`;

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

                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                                                {highlightContent}
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
