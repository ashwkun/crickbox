import React, { useEffect, useState } from 'react';
import { WinProbabilityResult } from '../utils/winProbability';
import { getTeamColor } from '../utils/teamColors';

interface WinProbabilityBarProps {
    data: WinProbabilityResult | null;
    isLoading?: boolean;
    expanded?: boolean;
}

const WinProbabilityBar: React.FC<WinProbabilityBarProps> = ({ data, isLoading, expanded = false }) => {
    // Animation state
    const [animatedProb, setAnimatedProb] = useState(50);
    const [isCalculating, setIsCalculating] = useState(true);

    useEffect(() => {
        if (data?.team1.probability) {
            if (isCalculating) {
                setTimeout(() => {
                    setAnimatedProb(data.team1.probability);
                    setIsCalculating(false);
                }, 100);
            } else {
                setAnimatedProb(data.team1.probability);
            }
        }
    }, [data, isCalculating]);

    // Loading Skeleton
    if (isLoading || !data) {
        return (
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                animation: 'pulse 1.5s infinite'
            }}>
                <div style={{ height: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', width: '30%', marginBottom: '16px' }}></div>
                <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', width: '100%' }}></div>
                <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }`}</style>
            </div>
        );
    }

    // Dynamic Colors
    const color1 = getTeamColor(data.team1.name) || '#3b82f6';
    let color2 = getTeamColor(data.team2.name) || '#ef4444';
    if (color1 === color2) {
        color2 = '#ef4444'; // Red fallback
        if (color1 === '#ef4444') color2 = '#3b82f6'; // Blue fallback
    }

    const getPhaseText = () => {
        if (!data.phase) return 'MATCH START';
        return data.phase.toUpperCase().replace('-', ' ');
    };

    const details = data.details;
    const isChase = data.message === 'Chase On';
    const showDetails = expanded && details;

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
            {/* Header: Centered "Win Probability" */}
            <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                textAlign: 'center',
                marginBottom: '16px'
            }}>
                Win Probability
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginBottom: '12px'
            }}>
                {/* Team 1 (Left) */}
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {data.team1.short_name || data.team1.name}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>
                        {Math.round(animatedProb)}%
                    </div>
                </div>

                {/* Center Phase */}
                <div style={{ textAlign: 'center', paddingBottom: '6px' }}>
                    <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        background: 'var(--bg-secondary)',
                        padding: '4px 8px',
                        borderRadius: '6px'
                    }}>
                        {getPhaseText()}
                    </span>
                </div>

                {/* Team 2 (Right) */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {data.team2.short_name || data.team2.name}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>
                        {Math.round(100 - animatedProb)}%
                    </div>
                </div>
            </div>

            {/* The Bar */}
            <div style={{
                height: '8px',
                width: '100%',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                overflow: 'hidden',
                display: 'flex',
                marginBottom: showDetails ? '20px' : '0'
            }}>
                <div style={{
                    width: `${animatedProb}%`,
                    height: '100%',
                    background: color1,
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }}></div>
                <div style={{
                    flex: 1,
                    height: '100%',
                    background: color2,
                    transition: 'all 1s ease'
                }}></div>
            </div>

            {/* EXPANDED DETAILS GRID */}
            {showDetails && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--border-color)'
                }}>
                    {!isChase ? (
                        <>
                            <StatBox label="Projected" value={details.projectedScore?.toString() || '-'} />
                            <StatBox label="Par Score" value={details.parScore?.toString() || '-'} />
                            <StatBox label="Current RR" value={details.crr?.toFixed(2) || '-'} />
                        </>
                    ) : (
                        <>
                            <StatBox label="Need" value={details.runsNeeded?.toString() || '-'} sub="Runs" />
                            <StatBox label="From" value={details.ballsRemaining?.toString() || '-'} sub="Balls" />
                            <StatBox label="Req RR" value={details.rrr?.toFixed(2) || '-'} highlight={details.rrr && details.rrr > 10} />
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const StatBox = ({ label, value, sub, highlight }: { label: string, value: string, sub?: string, highlight?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</span>
        <span style={{
            fontSize: '18px',
            fontWeight: 700,
            color: highlight ? '#ef4444' : 'var(--text-primary)'
        }}>
            {value} {sub && <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>{sub}</span>}
        </span>
    </div>
);

export default WinProbabilityBar;
