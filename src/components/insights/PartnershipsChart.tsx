import React, { useState } from 'react';

interface PartnershipData {
    Runs: string;
    Balls: string;
    ForWicket: number;
    Batsmen: {
        Batsman: string;
        Runs: string;
        Balls: string;
    }[];
}

interface InningsData {
    Partnerships?: PartnershipData[];
    Battingteam?: string;
}

interface PartnershipsChartProps {
    scorecard: {
        Innings?: InningsData[];
    } | null;
    players?: Record<string, { name: string }>;
}

const PartnershipsChart: React.FC<PartnershipsChartProps> = ({ scorecard, players }) => {
    const [selectedInnings, setSelectedInnings] = useState<number>(0);

    const innings = scorecard?.Innings || [];
    if (innings.length === 0) return null;

    const currentInnings = innings[selectedInnings];
    const partnerships = currentInnings?.Partnerships || [];

    if (partnerships.length === 0) return null;

    // Get max runs for bar scaling
    const maxRuns = Math.max(...partnerships.map(p => parseInt(p.Runs) || 0));

    // Get player name from ID
    const getPlayerName = (id: string) => {
        return players?.[id]?.name || `Player ${id}`;
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            padding: '16px 20px',
            border: '1px solid var(--border-color)',
        }}>
            {/* Header with Innings Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Partnerships</div>

                {innings.length > 1 && (
                    <div style={{ display: 'flex', gap: 4 }}>
                        {innings.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedInnings(idx)}
                                style={{
                                    padding: '4px 10px',
                                    background: selectedInnings === idx ? 'rgba(255,255,255,0.15)' : 'transparent',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 6,
                                    color: selectedInnings === idx ? '#fff' : 'rgba(255,255,255,0.5)',
                                    fontSize: 11,
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Innings {idx + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Partnership Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {partnerships
                    .filter(p => parseInt(p.Runs) > 0)
                    .sort((a, b) => parseInt(b.Runs) - parseInt(a.Runs))
                    .slice(0, 6) // Show top 6 partnerships
                    .map((p, idx) => {
                        const runs = parseInt(p.Runs) || 0;
                        const balls = parseInt(p.Balls) || 0;
                        const barWidth = maxRuns > 0 ? (runs / maxRuns) * 100 : 0;
                        const sr = balls > 0 ? ((runs / balls) * 100).toFixed(0) : '-';

                        // Get batsmen names
                        const batsmenNames = p.Batsmen.map(b => {
                            const name = getPlayerName(b.Batsman);
                            // Show abbreviated name
                            const parts = name.split(' ');
                            return parts.length > 1 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : name;
                        }).join(' & ');

                        return (
                            <div key={idx}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {batsmenNames}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                                        <span style={{ color: '#fff', fontWeight: 600 }}>{runs}</span> ({balls})
                                    </div>
                                </div>
                                <div style={{
                                    height: 6,
                                    background: 'rgba(255,255,255,0.08)',
                                    borderRadius: 3,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${barWidth}%`,
                                        height: '100%',
                                        background: runs >= 50 ? '#22c55e' : runs >= 30 ? '#3b82f6' : 'rgba(255,255,255,0.4)',
                                        borderRadius: 3,
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};

export default PartnershipsChart;
