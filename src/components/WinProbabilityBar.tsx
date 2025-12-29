import React, { useEffect, useState } from 'react';
import { WinProbabilityResult } from '../utils/winProbability';
import { getTeamColor } from '../utils/teamColors';

interface WinProbabilityBarProps {
    data: WinProbabilityResult | null;
    isLoading?: boolean;
}

const WinProbabilityBar: React.FC<WinProbabilityBarProps> = ({ data, isLoading }) => {
    // Animation state
    const [animatedProb, setAnimatedProb] = useState(50);

    useEffect(() => {
        if (data?.team1.probability) {
            setAnimatedProb(data.team1.probability);
        }
    }, [data]);

    // Loading Skeleton
    if (isLoading) {
        return (
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '12px 16px',
                marginBottom: '12px',
                animation: 'pulse 1.5s infinite'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', width: '20%' }}></div>
                    <div style={{ height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', width: '20%' }}></div>
                </div>
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', width: '100%' }}></div>
                <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }`}</style>
            </div>
        );
    }

    if (!data) return null;

    // Dynamic Colors
    const color1 = getTeamColor(data.team1.name) || '#3b82f6';
    const color2 = getTeamColor(data.team2.name) || '#ef4444';

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '12px 16px',
            marginBottom: '12px',
            fontFamily: 'var(--font-family-base, sans-serif)',
            border: '1px solid rgba(255,255,255,0.05)'
        }}>
            {/* Header Row: Combined Title, Percentages, Names, Phase */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '8px',
                flexWrap: 'wrap',
                gap: '8px'
            }}>
                {/* Team 1 (Left) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                            {Math.round(animatedProb)}%
                        </span>
                        <span style={{ fontSize: '11px', color: color1, fontWeight: 700, textTransform: 'uppercase' }}>
                            {data.team1.name}
                        </span>
                    </div>
                </div>

                {/* Center Info (Hidden on very small screens if tight, but generally visible) */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.5
                }}>
                    <span style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: '#fff',
                        textAlign: 'center'
                    }}>
                        WIN PROB
                    </span>
                    {data.phase && (
                        <span style={{
                            fontSize: '8px',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            color: '#fff',
                            marginTop: '1px'
                        }}>
                            {data.phase.replace('-', ' ')}
                        </span>
                    )}
                </div>

                {/* Team 2 (Right) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: color2, fontWeight: 700, textTransform: 'uppercase' }}>
                            {data.team2.name}
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1 }}>
                            {Math.round(100 - animatedProb)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Split Bar */}
            <div style={{
                position: 'relative',
                height: '6px',
                width: '100%',
                borderRadius: '10px',
                overflow: 'hidden',
                display: 'flex',
                background: 'rgba(0,0,0,0.2)'
            }}>
                {/* Team 1 Segment */}
                <div style={{
                    width: `${animatedProb}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${color1} 0%, ${color1}dd 100%)`,
                    boxShadow: `0 0 10px ${color1}66`,
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderTopRightRadius: '2px',
                    borderBottomRightRadius: '2px',
                    position: 'relative',
                    zIndex: 2
                }}>
                    {/* Shine */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        transform: 'skewX(-20deg)'
                    }} />
                </div>

                {/* Team 2 Segment */}
                <div style={{
                    flex: 1,
                    height: '100%',
                    background: `linear-gradient(90deg, ${color2}dd 0%, ${color2} 100%)`, // Gradient for team 2
                    boxShadow: `0 0 10px ${color2}44`,
                    transition: 'all 1s ease',
                    position: 'relative',
                    zIndex: 1
                }}></div>

                {/* Center Marker */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    zIndex: 10,
                    transform: 'translateX(-50%)'
                }}></div>
            </div>
        </div>
    );
};

export default WinProbabilityBar;
