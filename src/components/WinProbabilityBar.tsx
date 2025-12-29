import React, { useEffect, useState } from 'react';
import { WinProbabilityResult } from '../utils/winProbability';

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
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '16px',
                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}>
                <div style={{ height: '16px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', width: '33%', marginBottom: '16px' }}></div>
                <div style={{ height: '24px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '9999px', width: '100%' }}></div>
                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: .5; }
                    }
                `}</style>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div style={{
            width: '100%',
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginTop: '8px',
            marginBottom: '8px',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    margin: 0
                }}>
                    Win Probability
                </h3>
                {data.message && (
                    <span style={{
                        fontSize: '10px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 500,
                        textTransform: 'uppercase'
                    }}>
                        {data.message}
                    </span>
                )}
            </div>

            {/* Bar Container */}
            <div style={{
                position: 'relative',
                height: '24px',
                width: '100%',
                borderRadius: '9999px',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
                {/* Team 1 Bar - Gradient Red/Pink */}
                <div style={{
                    width: `${animatedProb}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #c53030 0%, #ef4444 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    paddingLeft: '12px',
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', zIndex: 10, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                        {data.team1.name} {Math.round(animatedProb)}%
                    </span>

                    {/* Skewed Shine Effect */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '30px',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        transform: 'skewX(-20deg) translateX(10px)',
                        filter: 'blur(2px)'
                    }}></div>
                </div>

                {/* Team 2 Bar - Greyish (Filling remaining space) */}
                <div style={{
                    flex: 1,
                    background: 'rgba(55, 65, 81, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '12px',
                    transition: 'all 1s ease',
                    position: 'relative'
                }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.8)', whiteSpace: 'nowrap', zIndex: 10 }}>
                        {Math.round(100 - animatedProb)}% {data.team2.name}
                    </span>
                </div>
            </div>

            {/* Footer / Phase Info */}
            {data.phase && (
                <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '9px',
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    <span>{data.phase.replace('-', ' ')} MODEL</span>
                    <span>UPDATED LIVE</span>
                </div>
            )}
        </div>
    );
};

export default WinProbabilityBar;
