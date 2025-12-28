import React, { useState, useMemo } from 'react';
import { BatsmanSplitsResponse, BatsmanShot } from '../../utils/h2hApi';

interface WagonWheelProps {
    batsmanSplits: BatsmanSplitsResponse | null;
}

const WagonWheel: React.FC<WagonWheelProps> = ({ batsmanSplits }) => {
    const [selectedPlayer, setSelectedPlayer] = useState<string>('all');

    // Get all players with shots
    const playersWithShots = useMemo(() => {
        if (!batsmanSplits?.Batsmen) return [];
        return Object.entries(batsmanSplits.Batsmen)
            .filter(([_, data]) => data.Shots && data.Shots.length > 0)
            .map(([id, data]) => ({
                id,
                name: data.Batsman,
                shots: data.Shots
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

    if (!batsmanSplits?.Batsmen || playersWithShots.length === 0) {
        return null;
    }

    // SVG dimensions
    const size = 280;
    const center = size / 2;
    const fieldRadius = 115;
    const pitchWidth = 12;
    const pitchHeight = 40;

    // Convert shot to SVG coordinates
    const shotToCoords = (shot: BatsmanShot) => {
        const angle = (parseInt(shot.Angle) - 90) * (Math.PI / 180); // -90 to make 0 degrees point up
        const distance = parseInt(shot.Distance);
        // Map distance 1-5 to field radius (20-100% of field)
        const r = (distance / 5) * fieldRadius * 0.85 + fieldRadius * 0.15;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
            runs: parseInt(shot.Runs)
        };
    };

    // Color based on runs
    const getRunColor = (runs: number) => {
        if (runs >= 6) return '#ef4444'; // Red for 6
        if (runs >= 4) return '#facc15'; // Yellow for 4
        if (runs >= 1) return '#22c55e'; // Green for 1-3
        return 'rgba(255,255,255,0.3)'; // Dot ball
    };

    // Get dot size based on runs
    const getDotSize = (runs: number) => {
        if (runs >= 6) return 8;
        if (runs >= 4) return 6;
        return 4;
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            padding: '16px 20px',
            border: '1px solid var(--border-color)',
        }}>
            {/* Header with Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Wagon Wheel</div>
                <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        padding: '6px 10px',
                        color: '#fff',
                        fontSize: 12,
                        cursor: 'pointer',
                        outline: 'none'
                    }}
                >
                    <option value="all" style={{ background: '#1a1a1a' }}>All Batsmen ({displayShots.length})</option>
                    {playersWithShots.map(p => (
                        <option key={p.id} value={p.id} style={{ background: '#1a1a1a' }}>
                            {p.name} ({p.shots.length})
                        </option>
                    ))}
                </select>
            </div>

            {/* SVG Field */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Field Circle (Main) */}
                    <circle
                        cx={center}
                        cy={center}
                        r={fieldRadius}
                        fill="rgba(34, 197, 94, 0.15)"
                        stroke="rgba(34, 197, 94, 0.4)"
                        strokeWidth={2}
                    />

                    {/* Inner Circle (30 yard) */}
                    <circle
                        cx={center}
                        cy={center}
                        r={fieldRadius * 0.45}
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth={1}
                        strokeDasharray="4,4"
                    />

                    {/* Zone Lines (8 zones) */}
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
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth={1}
                            />
                        );
                    })}

                    {/* Pitch Rectangle */}
                    <rect
                        x={center - pitchWidth / 2}
                        y={center - pitchHeight / 2}
                        width={pitchWidth}
                        height={pitchHeight}
                        fill="rgba(194, 178, 128, 0.6)"
                        rx={2}
                    />

                    {/* Shot Dots */}
                    {displayShots.map((shot, idx) => {
                        const { x, y, runs } = shotToCoords(shot);
                        return (
                            <circle
                                key={idx}
                                cx={x}
                                cy={y}
                                r={getDotSize(runs)}
                                fill={getRunColor(runs)}
                                opacity={0.85}
                            />
                        );
                    })}

                    {/* Batsman Indicator */}
                    <circle
                        cx={center}
                        cy={center + pitchHeight / 2 - 4}
                        r={4}
                        fill="#fff"
                    />
                </svg>
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 16,
                marginTop: 12,
                fontSize: 10,
                color: 'rgba(255,255,255,0.5)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                    <span>1-3</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#facc15' }} />
                    <span>4</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                    <span>6</span>
                </div>
            </div>
        </div>
    );
};

export default WagonWheel;
