import React, { useState, useEffect } from 'react';
import WikiImage from './WikiImage';

// AI Summary JSON URL (fetched from GitHub)
const AI_SUMMARY_URL = 'https://raw.githubusercontent.com/ashwkun/crickbox/main/src/data/ai_match_summaries.json';

// AI Icon SVG Component
const AIIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
        </defs>
        <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"
            fill="url(#aiGradient)" />
    </svg>
);

// AI Insight Card Component
const AIInsightCard = ({ summary }: { summary: string }) => {
    const [expanded, setExpanded] = useState(false);

    // Clean the summary: remove ** markdown
    const cleanText = summary.replace(/\*\*/g, '').trim();

    // Split into headline and body
    const lines = cleanText.split('\n').filter(l => l.trim());
    const headline = lines[0] || '';
    const body = lines.slice(1).join(' ');

    // Truncate body if collapsed
    const displayBody = expanded ? body : body.slice(0, 150);
    const showMoreButton = body.length > 150;

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
            backdropFilter: 'blur(12px)',
            borderRadius: 16,
            padding: '16px 18px',
            marginBottom: 20,
            border: '1px solid rgba(139, 92, 246, 0.25)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            position: 'relative' as const
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12
            }}>
                <AIIcon />
                <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase' as const,
                    letterSpacing: 1.5,
                    color: 'rgba(139, 92, 246, 0.9)'
                }}>AI Insight</span>
            </div>

            {/* Headline */}
            {headline && (
                <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#fff',
                    lineHeight: 1.4,
                    marginBottom: body ? 10 : 0
                }}>
                    {headline}
                </div>
            )}

            {/* Body */}
            {body && (
                <div style={{
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: 'rgba(255, 255, 255, 0.75)'
                }}>
                    {displayBody}{!expanded && body.length > 150 && '...'}
                </div>
            )}

            {/* Show More Button */}
            {showMoreButton && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#8b5cf6',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '8px 0 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                    }}
                >
                    {expanded ? 'Show less' : 'Show more'}
                    <span style={{ fontSize: 10 }}>{expanded ? '↑' : '↓'}</span>
                </button>
            )}
        </div>
    );
};

const CompletedDetail = ({ match, scorecard, onClose }) => {
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [loadingAI, setLoadingAI] = useState(true);

    // Fetch AI summary on mount
    useEffect(() => {
        const fetchAISummary = async () => {
            try {
                // Cache bust with timestamp
                const res = await fetch(`${AI_SUMMARY_URL}?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    const summary = data[match.match_id]?.text || null;
                    setAiSummary(summary);
                }
            } catch (e) {
                console.log('AI Summary fetch failed:', e);
            } finally {
                setLoadingAI(false);
            }
        };
        fetchAISummary();
    }, [match.match_id]);

    const team1 = match.participants?.[0];
    const team2 = match.participants?.[1];

    return (
        <div className="upcoming-detail">
            {/* Back Button */}
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    fontSize: 14,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontWeight: 600,
                    padding: 0
                }}
            >
                <span style={{ fontSize: 18 }}>←</span> Back
            </button>

            {/* Hero Card */}
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: 20,
                padding: 24,
                marginBottom: 24,
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, opacity: 0.8, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                    <span>{match.event_sub_status || match.event_status}</span>
                    <span>{match.series_name}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '40%' }}>
                        <WikiImage name={team1?.name} id={team1?.id} style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 4 }} />
                        <span style={{ fontSize: 16, fontWeight: 700, textAlign: 'center', lineHeight: 1.2, color: '#fff' }}>{team1?.short_name}</span>
                        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', marginTop: 4, color: '#fff' }}>{team1?.value || ''}</span>
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.5, fontWeight: 900, color: '#fff' }}>VS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '40%' }}>
                        <WikiImage name={team2?.name} id={team2?.id} style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 4 }} />
                        <span style={{ fontSize: 16, fontWeight: 700, textAlign: 'center', lineHeight: 1.2, color: '#fff' }}>{team2?.short_name}</span>
                        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', marginTop: 4, color: '#fff' }}>{team2?.value || ''}</span>
                    </div>
                </div>

                {match.result && (
                    <div style={{ textAlign: 'center', fontSize: 13, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, opacity: 0.9, color: 'rgba(255,255,255,0.8)' }}>
                        {match.result}
                    </div>
                )}
            </div>

            {/* AI Summary Card */}
            {aiSummary && (
                <AIInsightCard summary={aiSummary} />
            )}

            {/* Scorecard Content */}
            {scorecard ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {scorecard.Innings?.map((inn, idx) => (
                        <div key={idx} style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 16,
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '12px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <span style={{ fontWeight: 700, color: '#fff' }}>
                                    {scorecard.Teams?.[inn.Battingteam]?.Name_Full}
                                </span>
                                <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                                    {inn.Total}/{inn.Wickets}
                                    <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.8 }}>
                                        ({inn.Overs} ov)
                                    </span>
                                </span>
                            </div>

                            {/* Batting Table */}
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', width: '50%' }}>Batter</th>
                                            <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>R</th>
                                            <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>B</th>
                                            <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>4s</th>
                                            <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>6s</th>
                                            <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>SR</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inn.Batsmen?.map((bat, i) => {
                                            const pName = scorecard.Teams?.[inn.Battingteam]?.Players?.[bat.Batsman]?.Name_Full || '';
                                            return (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <WikiImage name={pName} id={bat.Batsman} type="player" style={{ width: 32, height: 32 }} circle={true} />
                                                            <div>
                                                                <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{pName}</div>
                                                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{bat.Howout_short || 'not out'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bat.Runs}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bat.Balls}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bat.Fours}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bat.Sixes}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bat.Strikerate}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Bowling Table */}
                            <h4 style={{ margin: '20px 16px 8px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Bowling</h4>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', width: '50%' }}>Bowler</th>
                                            <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>O</th>
                                            <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>M</th>
                                            <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>R</th>
                                            <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>W</th>
                                            <th style={{ textAlign: 'center', padding: '12px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>ER</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inn.Bowlers?.map((bowl, i) => {
                                            const pName = scorecard.Teams?.[inn.Bowlingteam]?.Players?.[bowl.Bowler]?.Name_Full;
                                            return (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <WikiImage name={pName} id={bowl.Bowler} type="player" style={{ width: 32, height: 32 }} circle={true} />
                                                            <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{pName}</div>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bowl.Overs}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bowl.Maidens}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bowl.Runs}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bowl.Wickets}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#fff' }}>{bowl.Economyrate}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading detailed stats...</div>
            )}
        </div>
    );
};

export default CompletedDetail;
