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
    const size = 320; // Slightly larger for better detail
    const center = size / 2;
    const fieldRadius = 140;
    const pitchWidth = 16;
    const pitchHeight = 44;

    // Striker position: Top of the pitch (as requested)
    const strikerX = center;
    const strikerY = center - (pitchHeight / 2);
    const nonStrikerY = center + (pitchHeight / 2);

    // Convert shot to SVG coordinates for Lines
    const shotToLineCoords = (shot: BatsmanShot) => {
        // Angle Handling:
        // Data usually has 0 around North/East. 
        // We want shots to emanate from Striker (Top) downwards potentially.
        // If we keep the same angular logic but just change the Origin to the Striker's position,
        // it should look correct relative to the wicket.

        const angleRad = (parseInt(shot.Angle) - 90) * (Math.PI / 180);
        const distance = parseInt(shot.Distance);

        // Scale distance to field radius
        // Shots go from Striker Position outward
        // We scale based on assumption that Max distance (6) hits boundary from center.
        // Since we are off-center (at top of pitch), length might need adjustment to stay in circle,
        // but for visual simplicity we scale to field radius.
        const length = (distance / 5.5) * fieldRadius;

        return {
            x2: strikerX + length * Math.cos(angleRad),
            y2: strikerY + length * Math.sin(angleRad),
            runs: parseInt(shot.Runs)
        };
    };

    // Color based on runs
    const getRunColor = (runs: number) => {
        if (runs >= 6) return '#ef4444'; // Red
        if (runs >= 4) return '#fbbf24'; // Amber
        if (runs >= 3) return '#84cc16'; // Lime
        if (runs >= 1) return '#22c55e'; // Green
        return 'rgba(255,255,255,0.25)'; // Dot - faint line
    };

    const getStrokeWidth = (runs: number) => {
        if (runs >= 6) return 2.5;
        if (runs >= 4) return 2;
        return 1.5;
    };

    const selectedPlayerData = playersWithShots.find(p => p.id === selectedPlayer);

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            position: 'relative', // For loading overlay
            minHeight: 380, // Taller for better view
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Loading Overlay */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="spinner" style={{
                        width: 24,
                        height: 24,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Header & Innings Tabs Container */}
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    textAlign: 'center',
                    padding: '16px 0 12px'
                }}>
                    Wagon Wheel
                </div>

                {/* Innings Tabs */}
                {innings.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingBottom: 12 }}>
                        {innings.map((inn: any, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => onInningsChange?.(idx + 1)}
                                style={{
                                    padding: '6px 14px',
                                    border: selectedInnings === idx + 1 ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 20,
                                    background: selectedInnings === idx + 1 ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                                    color: selectedInnings === idx + 1 ? '#22c55e' : 'rgba(255,255,255,0.6)',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {getInningsLabel(inn, idx)}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content  */}
            {(!batsmanSplits?.Batsmen) && !isLoading ? (
                <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                    No shot data available
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

                    {/* Floating Player Selector (Top Right) */}
                    <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                        <button
                            onClick={() => setShowSelector(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: 30,
                                padding: '4px 12px 4px 4px',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                        >
                            {selectedPlayer === 'all' ? (
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ fontSize: 9 }}>ALL</span>
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
                            <span>{selectedPlayer === 'all' ? 'All Batters' : selectedPlayerData?.name?.split(' ').pop()}</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>
                    </div>

                    {/* Selector Overlay */}
                    {showSelector && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(5,5,5,0.95)',
                            backdropFilter: 'blur(10px)',
                            zIndex: 30,
                            padding: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            animation: 'fadeIn 0.2s ease-out'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Select Batter</span>
                                <button
                                    onClick={() => setShowSelector(false)}
                                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                            <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12, paddingBottom: 20 }}>
                                {/* All Option */}
                                <button
                                    onClick={() => { setSelectedPlayer('all'); setShowSelector(false); }}
                                    style={{
                                        background: selectedPlayer === 'all' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                                        border: selectedPlayer === 'all' ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 16,
                                        padding: 16,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 10,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#aaa' }}>ALL</span>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>All Batsmen</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Combined</div>
                                    </div>
                                </button>

                                {/* Players */}
                                {playersWithShots.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setSelectedPlayer(p.id); setShowSelector(false); }}
                                        style={{
                                            background: selectedPlayer === p.id ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                                            border: selectedPlayer === p.id ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 16,
                                            padding: 16,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 10,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <WikiImage
                                            name={p.name}
                                            id={p.id}
                                            type="player"
                                            circle
                                            style={{ width: 56, height: 56, border: '2px solid rgba(255,255,255,0.1)' }}
                                        />
                                        <div style={{ textAlign: 'center', width: '100%' }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {p.name.split(' ').pop()}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                                                {p.runs} ({p.shots.length})
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SVG Visualization */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 10px', flex: 1, alignItems: 'center' }}>
                        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.3))' }}>
                            {/* Field Background */}
                            <circle
                                cx={center}
                                cy={center}
                                r={fieldRadius}
                                fill="rgba(255,255,255,0.02)"
                                stroke="rgba(255,255,255,0.2)" // Standard Boundary
                                strokeWidth={1}
                            />

                            {/* Inner Circle (30 yard) - Dashed */}
                            <circle
                                cx={center}
                                cy={center}
                                r={fieldRadius * 0.45}
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth={1}
                                strokeDasharray="6,4"
                            />

                            {/* Zone Spokes */}
                            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
                                const rad = (angle - 90) * (Math.PI / 180);
                                const x2 = center + fieldRadius * Math.cos(rad);
                                const y2 = center + fieldRadius * Math.sin(rad);
                                return (
                                    <line
                                        key={angle}
                                        x1={center}
                                        y1={center}
                                        x2={x2}
                                        y2={y2}
                                        stroke="rgba(255,255,255,0.05)"
                                        strokeWidth={1}
                                    />
                                );
                            })}

                            {/* Pitch Area */}
                            <rect
                                x={center - pitchWidth / 2}
                                y={center - pitchHeight / 2}
                                width={pitchWidth}
                                height={pitchHeight}
                                fill="rgba(200, 180, 140, 0.3)" // Faint pitch
                                rx={2}
                            />

                            {/* Wickets */}
                            {/* Striker End (Top) */}
                            <rect x={center - 3} y={strikerY - 2} width={6} height={2} fill="#fff" />
                            {/* Non-Striker End (Bottom) */}
                            <rect x={center - 3} y={nonStrikerY} width={6} height={2} fill="rgba(255,255,255,0.5)" />


                            {/* SHOT LINES */}
                            <g>
                                {displayShots.map((shot, idx) => {
                                    const { x2, y2, runs } = shotToLineCoords(shot);
                                    const color = getRunColor(runs);
                                    return (
                                        <g key={idx}>
                                            <line
                                                x1={strikerX}
                                                y1={strikerY}
                                                x2={x2}
                                                y2={y2}
                                                stroke={color}
                                                strokeWidth={getStrokeWidth(runs)}
                                                strokeLinecap="round"
                                                opacity={0.8}
                                            />
                                            {/* Dot at end for boundary shots */}
                                            {runs >= 4 && (
                                                <circle cx={x2} cy={y2} r={runs >= 6 ? 3 : 2} fill={color} />
                                            )}
                                        </g>
                                    );
                                })}
                            </g>

                            {/* Striker Dot (Origin) */}
                            <circle cx={strikerX} cy={strikerY} r={3} fill="#fff" stroke="var(--bg-card)" strokeWidth={1} />

                        </svg>
                    </div>

                    {/* Legend Footer */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 16,
                        padding: '0 0 16px',
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.5)',
                        borderTop: '1px solid rgba(255,255,255,0.03)',
                        paddingTop: 12
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 16, height: 2, background: '#22c55e' }} />
                            <span>1-3</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 16, height: 3, background: '#fbbf24' }} />
                            <span>4</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 16, height: 3, background: '#ef4444' }} />
                            <span>6</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WagonWheel;
