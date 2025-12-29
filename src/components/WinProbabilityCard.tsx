import React from 'react';
import WinProbabilityBar from './WinProbabilityBar';
import { WinProbabilityResult } from '../utils/winProbability';

interface WinProbabilityCardProps {
    data: WinProbabilityResult | null;
}

const WinProbabilityCard: React.FC<WinProbabilityCardProps> = ({ data }) => {
    if (!data) return null;

    const { details, message } = data;
    const isChase = message === 'Chase On';

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>

            {/* The Main Bar */}
            <WinProbabilityBar data={data} />

            {/* Extended Details Grid */}
            {details && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '12px',
                    marginTop: '16px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '16px'
                }}>
                    {!isChase ? (
                        /* 1st Innings Stats */
                        <>
                            <StatBox label="Projected" value={details.projectedScore?.toString() || '-'} />
                            <StatBox label="Par Score" value={details.parScore?.toString() || '-'} />
                            <StatBox label="Current RR" value={details.crr?.toFixed(2) || '-'} />
                        </>
                    ) : (
                        /* 2nd Innings Stats */
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</span>
        <span style={{
            fontSize: '16px',
            fontWeight: 700,
            color: highlight ? '#ef4444' : '#fff'
        }}>
            {value} {sub && <span style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>{sub}</span>}
        </span>
    </div>
);

export default WinProbabilityCard;
