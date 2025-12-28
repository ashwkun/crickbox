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

    // Get innings label like scorecard
    const getInningsLabel = (inn: any, idx: number) => {
        const teamId = inn.Battingteam;
        const teamName = scorecard?.Teams?.[teamId]?.Name_Short || `Team ${idx + 1}`;
        const inningsNum = idx < 2 ? '' : ` (${Math.floor(idx / 2) + 1})`;
        return `${teamName}${inningsNum}`;
    };

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
    const size = 360; // Increased size for better resolution
    const center = size / 2;
    const fieldRadius = 160;
    const pitchWidth = 14;
    const pitchHeight = 48; // Represents 22 yards roughly scaled

    // Origin for shots - Striker at Top of Pitch
    const strikerX = center;
    const strikerY = center - (pitchHeight / 2);
    const nonStrikerY = center + (pitchHeight / 2);

    // Calculate distance to boundary from Striker for a given angle
    // Ray-Circle Intersection:
    // Origin O = (0, -h) relative to Circle Center (0,0)
    // Ray D = (cos t, sin t)
    // t = h*sin(theta) + sqrt( R^2 - h^2*cos^2(theta) )
    // Here h = pitchHeight/2. R = fieldRadius.
    const getBoundaryDistance = (angleRad: number) => {
        const h = pitchHeight / 2;
        // In SVG logic: 0 is Right (x+), 90 is Down (y+)
        // Striker is at (0, -h) relative to center.
        // We want |Vector(Strike -> Boundary)|.
        // Formula derived earlier: distance = h*sin(theta) + sqrt(R^2 - h^2*cos^2(theta))
        // Is this correct for 0=Right, 90=Down?
        // sin(90) = 1. formula -> h + sqrt(R^2) = h+R. Striker is at -h. Boundary at +R(relative to center). Total dist = R - (-h) = R+h. Correct.
        // sin(-90) = -1. formula -> -h + sqrt(R^2) = R-h. Striker at -h. Boundary Top at -R. Dist = -h - (-R) = R-h. Correct.

        const sinT = Math.sin(angleRad);
        const cosT = Math.cos(angleRad);
        const term1 = h * sinT;
        const term2 = Math.sqrt(Math.pow(fieldRadius, 2) - Math.pow(h * cosT, 2));

        return term1 + term2;
    };

    // Convert shot to SVG coordinates for Lines
    const shotToLineCoords = (shot: BatsmanShot) => {
        // Angle Mapping
        // Assuming Standard Compass: 0=N, 90=E, 180=S, 270=W.
        // Striker at N (Top). Straight Drive -> South (180).
        // SVG: 0=Right, 90=Down.
        // We map 180 (South) -> 90 (Down).
        // Thus Angle - 90.

        const angleRad = (parseInt(shot.Angle) - 90) * (Math.PI / 180);

        // Calculate max possible distance (Boundary) at this angle
        const maxDist = getBoundaryDistance(angleRad);

        const rawDist = parseInt(shot.Distance);

        // Accurate Scaling
        // 5 or 6 means Boundary.
        // 1-4 are intermediate.
        // Let's assume '5.5' is the boundary threshold for "MAX" hit.
        let scaleFactor = rawDist / 5.5;

        // Clamp boundaries to exactly touch the edge if >= 5
        if (rawDist >= 5) scaleFactor = 1.0;
        if (scaleFactor > 1) scaleFactor = 1;

        const actualLength = scaleFactor * maxDist;

        return {
            x2: strikerX + actualLength * Math.cos(angleRad),
            y2: strikerY + actualLength * Math.sin(angleRad),
            runs: parseInt(shot.Runs)
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

    const getStrokeWidth = (runs: number) => {
        if (runs >= 6) return 2.5;
        if (runs === 4) return 2;
        return 1.5;
    };

    const getOpacity = (runs: number) => {
        if (runs >= 4) return 1;
        if (runs >= 1) return 0.8;
        return 0.4;
    };

    const selectedPlayerData = playersWithShots.find(p => p.id === selectedPlayer);

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 24, // Softer corners
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            position: 'relative',
            minHeight: 460, // Taller
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
            {/* Loading Overlay */}
            {isLoading && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
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

            {/* Header Area */}
            <div style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)',
                padding: '16px 0 0'
            }}>
                <div style={{
                    fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center',
                    marginBottom: 16
                }}>
                    Wagon Wheel
                </div>

                {/* Innings Tabs */}
                {innings.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: 0 }}>
                        {innings.map((inn: any, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => onInningsChange?.(idx + 1)}
                                style={{
                                    padding: '6px 16px',
                                    borderBottom: selectedInnings === idx + 1 ? '2px solid #fff' : '2px solid transparent',
                                    background: 'transparent',
                                    color: selectedInnings === idx + 1 ? '#fff' : 'rgba(255,255,255,0.4)',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit'
                                }}
                            >
                                {scorecard?.Teams?.[inn.Battingteam]?.Name_Short || `INN ${idx + 1}`}
                            </button>
                        ))}
                    </div>
                )}

                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginTop: 0 }} />
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

                    {/* Floating Player Selector Pill */}
                    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
                        <button
                            onClick={() => setShowSelector(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'rgba(20,20,20,0.8)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 30,
                                padding: '6px 14px 6px 6px',
                                color: '#fff',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                transition: 'transform 0.1s'
                            }}
                        >
                            {selectedPlayer === 'all' ? (
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #333, #111)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                </div>
                            ) : (
                                <WikiImage
                                    name={selectedPlayerData?.name}
                                    id={selectedPlayerData?.id}
                                    type="player"
                                    circle
                                    style={{ width: 28, height: 28, border: '1px solid rgba(255,255,255,0.2)' }}
                                />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                                <span style={{ fontSize: 12, fontWeight: 700 }}>{selectedPlayer === 'all' ? 'All Batters' : selectedPlayerData?.name?.split(' ').pop()}</span>
                            </div>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginLeft: 2 }}>
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>
                    </div>

                    {/* Selector Overlay */}
                    {showSelector && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(5,5,5,0.98)',
                            backdropFilter: 'blur(16px)',
                            zIndex: 30,
                            padding: 24,
                            display: 'flex', flexDirection: 'column',
                            animation: 'fadeIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Select Batter</span>
                                <button
                                    onClick={() => setShowSelector(false)}
                                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 8, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                            <div className="hide-scrollbar" style={{ overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, paddingBottom: 20 }}>
                                {/* All Option */}
                                <button
                                    onClick={() => { setSelectedPlayer('all'); setShowSelector(false); }}
                                    style={{
                                        background: selectedPlayer === 'all' ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))' : 'rgba(255,255,255,0.03)',
                                        border: selectedPlayer === 'all' ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 20, padding: 16,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: '#666' }}>ALL</span>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Combined</div>
                                    </div>
                                </button>

                                {/* Players */}
                                {playersWithShots.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setSelectedPlayer(p.id); setShowSelector(false); }}
                                        style={{
                                            background: selectedPlayer === p.id ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))' : 'rgba(255,255,255,0.03)',
                                            border: selectedPlayer === p.id ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: 20, padding: 16,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <WikiImage
                                            name={p.name}
                                            id={p.id}
                                            type="player"
                                            circle
                                            style={{ width: 64, height: 64, border: '2px solid rgba(255,255,255,0.1)' }}
                                        />
                                        <div style={{ textAlign: 'center', width: '100%' }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {p.name.split(' ').pop()}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                                                {p.runs} ({p.shots.length})
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SVG Visualization */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0 20px', flex: 1, alignItems: 'center' }}>
                        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.4))' }}>
                            {/* Field Background - Gradient */}
                            <defs>
                                <radialGradient id="fieldGradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                                    <stop offset="0%" stopColor="rgba(34, 197, 94, 0.08)" />
                                    <stop offset="100%" stopColor="rgba(34, 197, 94, 0.02)" />
                                </radialGradient>
                            </defs>
                            <circle
                                cx={center} cy={center} r={fieldRadius}
                                fill="url(#fieldGradient)"
                                stroke="rgba(255,255,255,0.1)" strokeWidth={1}
                            />

                            {/* Inner Circle (30 yard) - Subtle */}
                            <circle
                                cx={center} cy={center} r={fieldRadius * 0.45}
                                fill="none"
                                stroke="rgba(255,255,255,0.05)" strokeWidth={1}
                                strokeDasharray="4,4"
                            />

                            {/* Zone Spokes - Very Subtle */}
                            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
                                const rad = (angle - 90) * (Math.PI / 180);
                                const x2 = center + fieldRadius * Math.cos(rad);
                                const y2 = center + fieldRadius * Math.sin(rad);
                                return (
                                    <line
                                        key={angle}
                                        x1={center} y1={center} x2={x2} y2={y2}
                                        stroke="rgba(255,255,255,0.03)" strokeWidth={1}
                                    />
                                );
                            })}

                            {/* Pitch Area */}
                            <rect
                                x={center - pitchWidth / 2} y={center - pitchHeight / 2}
                                width={pitchWidth} height={pitchHeight}
                                fill="rgba(255, 255, 255, 0.08)"
                                rx={2}
                            />

                            {/* Wickets */}
                            <rect x={center - 4} y={strikerY - 2} width={8} height={2} fill="#fff" rx={1} />
                            <rect x={center - 4} y={nonStrikerY} width={8} height={2} fill="rgba(255,255,255,0.3)" rx={1} />


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
                                            {/* Minimal Dot only for boundary to show impact point */}
                                            {runs >= 4 && (
                                                <circle
                                                    cx={x2} cy={y2}
                                                    r={runs >= 6 ? 2.5 : 1.5}
                                                    fill={color}
                                                    style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                                                />
                                            )}
                                        </g>
                                    );
                                })}
                            </g>

                            {/* Striker Dot (Origin) */}
                            <circle cx={strikerX} cy={strikerY} r={3} fill="#fff" stroke="var(--bg-card)" strokeWidth={1.5} />

                        </svg>
                    </div>

                    {/* Legend Footer - Clean */}
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: 24,
                        padding: '0 0 20px', fontSize: 11, color: 'rgba(255,255,255,0.4)',
                        fontWeight: 500
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                            <span>1s & 2s</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 6px rgba(251, 191, 36, 0.4)' }} />
                            <span style={{ color: '#fbbf24' }}>4s</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px rgba(239, 68, 68, 0.4)' }} />
                            <span style={{ color: '#ef4444' }}>6s</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WagonWheel;
