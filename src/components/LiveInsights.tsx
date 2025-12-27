import React from 'react';

interface LiveInsightsProps {
    h2hData: any;
}

const LiveInsights: React.FC<LiveInsightsProps> = ({ h2hData }) => {
    if (!h2hData) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* H2H Record Card */}
            {h2hData.team?.head_to_head?.comp_type?.data && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Head to Head</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {(h2hData.team.head_to_head.comp_type.data as any[]).slice(0, 2).map((t: any, idx: number) => (
                            <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{ fontSize: 28, fontWeight: 700, color: idx === 0 ? '#4ade80' : '#60a5fa' }}>{t.win || 0}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{t.short_name}</div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{t.matches || 0} matches</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent H2H Matches */}
            {h2hData.team?.against_last_n_matches?.result?.length > 0 && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Recent Encounters</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(h2hData.team.against_last_n_matches.result as any[]).slice(0, 5).map((m: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div>
                                    <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{m.winner_team_name || 'Draw'}</div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{m.venue_name}</div>
                                </div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{m.match_start_date}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Venue Stats */}
            {h2hData.team?.head_to_head?.venue && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Venue Stats</div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginBottom: 8 }}>{h2hData.team.head_to_head.venue.venue_display_name || h2hData.team.head_to_head.venue.venue}</div>
                    {h2hData.team.head_to_head.venue.data && (
                        <div style={{ display: 'flex', gap: 12 }}>
                            {(h2hData.team.head_to_head.venue.data as any[]).slice(0, 2).map((t: any, idx: number) => (
                                <div key={idx} style={{ flex: 1, textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: idx === 0 ? '#4ade80' : '#60a5fa' }}>{t.win}</div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{t.short_name} wins</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LiveInsights;
