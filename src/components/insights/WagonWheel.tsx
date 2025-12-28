import React, { useState, useMemo } from 'react';
import { BatsmanSplitsResponse, BatsmanShot } from '../../utils/h2hApi';
import WikiImage from '../WikiImage';

interface WagonWheelProps {
    batsmanSplits: BatsmanSplitsResponse | null;
    scorecard?: any;
    selectedInnings?: number;
    onInningsChange?: (innings: number) => void;
    isLoading?: boolean;
}

const WagonWheel: React.FC<WagonWheelProps> = ({ batsmanSplits, scorecard, selectedInnings = 1, onInningsChange, isLoading = false }) => {
    const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
    const [showSelector, setShowSelector] = useState(false);

    // Get innings from scorecard
    const innings = scorecard?.Innings || [];

    // Get all players with shots
    const playersWithShots = useMemo(() => {
        if (!batsmanSplits?.Batsmen) return [];
        return Object.entries(batsmanSplits.Batsmen)
            .filter(([_, data]) => data.Shots && data.Shots.length > 0)
            .map(([id, data]) => ({
                id,
                name: data.Batsman,
                shots: data.Shots,
                runs: data.Shots.reduce((acc, shot) => acc + parseInt(shot.Runs), 0)
            }));
    }, [batsmanSplits]);

    // Get shots to display (all or specific player)
    const displayShots = useMemo(() => {
        if (selectedPlayer === 'all') {
            return playersWithShots.flatMap(p => p.shots);
        }
        const player = playersWithShots.find(p => p.id === selectedPlayer);
        return player?.shots || [];
    }, [selectedPlayer, playersWithShots]);


    // SVG dimensions
    const size = 360;
    const center = size / 2;
    const fieldRadius = 160;
    const pitchWidth = 14;
    const pitchHeight = 48; // Represents 22 yards roughly

    // Striker position: Top of the pitch relative to center
    const strikerX = center;
    const strikerY = center - (pitchHeight / 2);
    const nonStrikerY = center + (pitchHeight / 2);

    // Calculate distance to boundary from Striker for a given angle
    // Ray-Circle Intersection logic from earlier
    const getBoundaryDistance = (angleRad: number) => {
        const h = pitchHeight / 2;
        const dx = Math.cos(angleRad);
        const dy = -Math.sin(angleRad); // Invert Y for SVG as Up is -Y

        // Quadratic coeffs for intersection (0,-h) + t(dx, dy) with x^2+y^2=R^2
        const a = 1;
        const b = 2 * (-h) * dy;
        const c = Math.pow(-h, 2) - Math.pow(fieldRadius, 2);

        const discriminant = Math.pow(b, 2) - 4 * a * c;
        if (discriminant < 0) return fieldRadius;

        const t = (-b + Math.sqrt(discriminant)) / (2 * a);
        return t;
    };

    // Convert shot to SVG coordinates for Lines
    const shotToLineCoords = (shot: BatsmanShot) => {
        // Angle Mapping: 0=East (Math Standard), CCW.
        // SVG Y is Down, so we invert sin component.

        const angleRad = parseInt(shot.Angle) * (Math.PI / 180);
        const maxDist = getBoundaryDistance(angleRad);

        const runs = parseInt(shot.Runs);
        const rawDist = parseInt(shot.Distance); // 1-5 scale typically

        // Visual Scaling Map based on API Data Analysis:
        // Dist 5 = Boundary (4s, 6s) -> 100%
        // Dist 4 = Deep Field (Singles/Doubles vs Deep) -> ~70%
        // Dist 3 = Mid Field -> ~50%
        // Dist 2 = Close -> ~35%

        let scaleFactor = 0.5; // Default fallback

        if (rawDist >= 5) {
            scaleFactor = 1.0;
        } else if (rawDist === 4) {
            scaleFactor = 0.72; // Deep but distinct from boundary
        } else if (rawDist === 3) {
            scaleFactor = 0.55;
        } else if (rawDist === 2) {
            scaleFactor = 0.35;
        } else if (rawDist === 1) {
            scaleFactor = 0.25;
        } else {
            // Fallback for weird data, use runs hint
            scaleFactor = runs >= 4 ? 1.0 : 0.6;
        }

        // Slight randomization for aesthetic separation of overlapping lines
        if (scaleFactor < 1.0) {
            scaleFactor += (Math.random() * 0.05);
        }

        // Clamp
        if (scaleFactor > 1.0) scaleFactor = 1.0;

        const actualLength = scaleFactor * maxDist;

        return {
            x2: strikerX + actualLength * Math.cos(angleRad),
            y2: strikerY - actualLength * Math.sin(angleRad), // Invert Y
            runs: runs
        };
    };

    // Refined Colors - Premium Palette
    const getRunColor = (runs: number) => {
        if (runs >= 6) return '#ef4444'; // Red
        if (runs === 4) return '#fbbf24'; // Amber
        if (runs === 3) return '#84cc16'; // Lime
        if (runs === 2) return '#22c55e'; // Green
        if (runs === 1) return '#10b981'; // Emerald
        return 'rgba(255,255,255,0.15)'; // Dot runs
    };

    // Increased stroke width for better visibility without glow
    const getStrokeWidth = (runs: number) => {
        if (runs >= 6) return 3;
        if (runs === 4) return 2.5;
        return 1.5;
    };

    const getOpacity = (runs: number) => {
        if (runs >= 4) return 1;
        if (runs >= 1) return 0.8;
        return 0.5; // Slightly higher for 1s since glow is gone
    };

    const selectedPlayerData = playersWithShots.find(p => p.id === selectedPlayer);

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
            overflow: 'hidden',
            position: 'relative',
            minHeight: 460,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Loading Overlay */}
            {isLoading && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="spinner" style={{
                        width: 28, height: 28,
                        border: '2px solid rgba(255,255,255,0.1)',
                        borderTop: '2px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                    }} />
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Header Area - Simplified */}
            <div style={{ padding: '16px 16px 0' }}>
                {/* Standard Tab Switcher */}
                {innings.length > 0 && (
                    <div style={{
                        display: 'flex',
                        gap: 24,
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        paddingBottom: 0,
                        marginBottom: 16
                    }}>
                        {innings.map((inn: any, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => onInningsChange?.(idx + 1)}
                                style={{
                                    padding: '8px 4px',
                                    borderBottom: selectedInnings === idx + 1 ? '3px solid #E5E5E5' : '3px solid transparent',
                                    background: 'transparent',
                                    color: selectedInnings === idx + 1 ? '#fff' : 'rgba(255,255,255,0.5)',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'color 0.2s',
                                    fontFamily: 'inherit',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {scorecard?.Teams?.[inn.Battingteam]?.Name_Short || `INN ${idx + 1}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content  */}
            {(!batsmanSplits?.Batsmen) && !isLoading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'rgba(255,255,255,0.3)' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    <span style={{ fontSize: 13 }}>No tracking data</span>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

                    {/* Floating Player Selector Pill - Simplified */}
                    <div style={{ position: 'absolute', top: 0, right: 16, zIndex: 10 }}>
                        <button
                            onClick={() => setShowSelector(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'rgba(30,30,30,0.9)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: 100,
                                padding: '6px 12px 6px 6px',
                                color: '#fff',
                                transition: 'background 0.2s'
                            }}
                        >
                            {selectedPlayer === 'all' ? (
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                </div>
                            ) : (
                                <WikiImage
                                    name={selectedPlayerData?.name}
                                    id={selectedPlayerData?.id}
                                    type="player"
                                    circle
                                    style={{ width: 24, height: 24, border: '1px solid rgba(255,255,255,0.2)' }}
                                />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedPlayer === 'all' ? 'All Batters' : selectedPlayerData?.name?.split(' ').pop()}</span>
                            </div>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginLeft: 4 }}>
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>
                    </div>

                    {/* Selector Overlay */}
                    {showSelector && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(10,10,10,0.98)', // Darker flat BG
                            zIndex: 30,
                            padding: 20,
                            display: 'flex', flexDirection: 'column',
                            animation: 'fadeIn 0.2s ease-out'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Select Batter</span>
                                <button
                                    onClick={() => setShowSelector(false)}
                                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 8, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>

                            <div className="hide-scrollbar" style={{ overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12, paddingBottom: 20 }}>
                                {/* All Option */}
                                <button
                                    onClick={() => { setSelectedPlayer('all'); setShowSelector(false); }}
                                    style={{
                                        background: selectedPlayer === 'all' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                                        border: selectedPlayer === 'all' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                                        borderRadius: 12, padding: 12,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#666' }}>ALL</span>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Combined</div>
                                    </div>
                                </button>

                                {/* Players */}
                                {playersWithShots.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setSelectedPlayer(p.id); setShowSelector(false); }}
                                        style={{
                                            background: selectedPlayer === p.id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                                            border: selectedPlayer === p.id ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                                            borderRadius: 12, padding: 12,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <WikiImage
                                            name={p.name}
                                            id={p.id}
                                            type="player"
                                            circle
                                            style={{ width: 48, height: 48, border: '1px solid rgba(255,255,255,0.1)' }}
                                        />
                                        <div style={{ textAlign: 'center', width: '100%' }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {p.name.split(' ').pop()}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                                                {p.runs} ({p.shots.length})
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SVG Visualization */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', flex: 1, alignItems: 'center' }}>
                        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                            {/* Field Background - Solid Flat Color */}
                            <circle cx={center} cy={center} r={fieldRadius} fill="#1a1a1a" stroke="none" />

                            {/* Inner Circle (30 yard) - Simple Line */}
                            <circle
                                cx={center} cy={center} r={fieldRadius * 0.45}
                                fill="none"
                                stroke="rgba(255,255,255,0.1)" strokeWidth={1}
                                strokeDasharray="4,4"
                            />

                            {/* Boundary Rope */}
                            <circle
                                cx={center} cy={center} r={fieldRadius}
                                fill="none"
                                stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}
                            />

                            {/* Pitch Area - Flat */}
                            <rect
                                x={center - pitchWidth / 2} y={center - pitchHeight / 2}
                                width={pitchWidth} height={pitchHeight}
                                fill="rgba(255, 255, 255, 0.1)"
                                rx={1}
                            />

                            {/* Wickets */}
                            <rect x={center - 3} y={strikerY - 2} width={6} height={2} fill="#fff" />
                            <rect x={center - 3} y={nonStrikerY} width={6} height={2} fill="rgba(255,255,255,0.5)" />


                            {/* SHOT LINES */}
                            <g>
                                {displayShots.map((shot, idx) => {
                                    const { x2, y2, runs } = shotToLineCoords(shot);
                                    const color = getRunColor(runs);
                                    const width = getStrokeWidth(runs);
                                    const opacity = getOpacity(runs);

                                    return (
                                        <g key={idx}>
                                            <line
                                                x1={strikerX} y1={strikerY}
                                                x2={x2} y2={y2}
                                                stroke={color}
                                                strokeWidth={width}
                                                strokeLinecap="round"
                                                opacity={opacity}
                                            />
                                            {/* Flat Dot for boundary */}
                                            {runs >= 4 && (
                                                <circle
                                                    cx={x2} cy={y2}
                                                    r={runs >= 6 ? 2.5 : 2}
                                                    fill={color}
                                                />
                                            )}
                                        </g>
                                    );
                                })}
                            </g>

                            {/* Striker Dot (Origin) */}
                            <circle cx={strikerX} cy={strikerY} r={2.5} fill="#fff" />

                        </svg>
                    </div>

                    {/* Legend Footer - Clean */}
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: 24,
                        padding: '0 0 20px', fontSize: 11, color: 'rgba(255,255,255,0.5)',
                        fontWeight: 500
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                            <span>1s & 2s</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#84cc16' }} />
                            <span>3s</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
                            <span>4s</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                            <span>6s</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WagonWheel;
