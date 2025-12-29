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

    // Loading Skeleton - Matching LiveDetail.tsx card skeleton style where possible
    if (isLoading) {
        return (
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '16px',
                animation: 'pulse 1.5s infinite'
            }}>
                <div style={{ height: '12px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', width: '30%', marginBottom: '12px' }}></div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', width: '100%' }}></div>
                <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }`}</style>
            </div>
        );
    }

    if (!data) return null;

    // Dynamic Colors
    const color1 = getTeamColor(data.team1.name) || '#3b82f6'; // Default Blue
    const color2 = getTeamColor(data.team2.name) || '#ef4444'; // Default Red

    // Ensure colors are distinct if for some reason they match (rare)
    const distinctColor2 = color1 === color2 ? '#64748b' : color2;

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.05)', // Standard premium card bg
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '12px', // Standard gap
            fontFamily: 'var(--font-family-base, sans-serif)'
        }}>
            {/* Header: Title + Message Pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    margin: 0
                }}>
                    Win Probability
                </h3>
                {data.message && (
                    <span style={{
                        fontSize: '9px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '2px 8px',
                        borderRadius: '100px', // Pill shape
                        fontWeight: 600,
                        textTransform: 'uppercase'
                    }}>
                        {data.message}
                    </span>
                )}
            </div>

            {/* Probability Percentages Row (Above Bar) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                        {Math.round(animatedProb)}%
                    </span>
                    <span style={{ fontSize: '10px', color: color1, fontWeight: 700, marginTop: '2px' }}>
                        {data.team1.name}
                    </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1 }}>
                        {Math.round(100 - animatedProb)}%
                    </span>
                    <span style={{ fontSize: '10px', color: distinctColor2, fontWeight: 700, marginTop: '2px' }}>
                        {data.team2.name}
                    </span>
                </div>
            </div>

            {/* Sleek Bar */}
            <div style={{
                position: 'relative',
                height: '6px', // Much thinner/sleeker
                width: '100%',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                display: 'flex'
            }}>
                {/* Team 1 Segment */}
                <div style={{
                    width: `${animatedProb}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${color1} 0%, ${color1}dd 100%)`, // Subtle gradient
                    boxShadow: `0 0 10px ${color1}66`, // Small glow
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: '10px' // Rounded ends even inside
                }}></div>

                {/* Team 2 Segment (Background/Remaining) */}
                <div style={{
                    flex: 1,
                    height: '100%',
                    background: distinctColor2,
                    opacity: 0.3, // Dimmer than active
                    transition: 'all 1s ease'
                }}></div>

                {/* Center Marker (50%) */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    zIndex: 10
                }}></div>
            </div>

            {/* Phase Info Footer */}
            {data.phase && (
                <div style={{
                    marginTop: '8px',
                    textAlign: 'center',
                    fontSize: '9px',
                    color: 'rgba(255, 255, 255, 0.25)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    {data.phase.replace('-', ' ')} Phase
                </div>
            )}
        </div>
    );
};

export default WinProbabilityBar;
