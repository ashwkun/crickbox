import React, { useState, useEffect } from 'react';
import WikiImage from './WikiImage';

// AI Summary JSON URL (fetched from GitHub)
const AI_SUMMARY_URL = 'https://raw.githubusercontent.com/ashwkun/crickbox/main/src/data/ai_match_summaries.json';

// Model Logo Components
const GrokLogo = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.06-7.44 7-7.93v15.86zm2-15.86c3.94.49 7 3.85 7 7.93s-3.06 7.44-7 7.93V4.07z" fill="#fff" />
    </svg>
);

const GPTLogo = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364l2.0201-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4043-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997z" fill="#fff" />
    </svg>
);

const LlamaLogo = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" fill="none" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">L</text>
    </svg>
);

// AI Insight Card Component with .WRAP branding
const AIInsightCard = ({ summary, model }: { summary: string; model?: string }) => {
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

    // Get model display info
    const getModelInfo = () => {
        if (!model) return null;
        if (model.includes('grok')) return { name: 'Grok', Logo: GrokLogo };
        if (model.includes('gpt')) return { name: 'GPT-4o', Logo: GPTLogo };
        if (model.includes('Llama')) return { name: 'Llama', Logo: LlamaLogo };
        return null;
    };
    const modelInfo = getModelInfo();

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
            {/* .WRAP Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12
            }}>
                <span style={{
                    fontFamily: '"BBH Bartle", sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: 1,
                    background: 'linear-gradient(90deg, #8b5cf6 0%, #8b5cf6 35%, #a78bfa 50%, #8b5cf6 65%, #8b5cf6 100%)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'wrapShimmer 2s ease-in-out infinite alternate'
                }}>.WRAP</span>

                {/* Powered by Model */}
                {modelInfo && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        opacity: 0.5,
                        fontSize: 10
                    }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>by</span>
                        <modelInfo.Logo />
                        <span style={{ color: '#fff', fontWeight: 500 }}>{modelInfo.name}</span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes wrapShimmer {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
            `}</style>

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
    const [aiModel, setAiModel] = useState<string | null>(null);
    const [loadingAI, setLoadingAI] = useState(true);

    // Fetch AI summary on mount
    useEffect(() => {
        const fetchAISummary = async () => {
            try {
                // Cache bust with timestamp
                const res = await fetch(`${AI_SUMMARY_URL}?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    const matchData = data[match.match_id];
                    setAiSummary(matchData?.text || null);
                    setAiModel(matchData?.model || null);
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
                <AIInsightCard summary={aiSummary} model={aiModel || undefined} />
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
