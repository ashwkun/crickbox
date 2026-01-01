import React, { useState } from 'react';

// Hardcoded content from documentation artifacts
const SECTIONS = [
    { id: 'arch', label: 'Architecture' },
    { id: 'flows', label: 'API Flows' },
    { id: 'api', label: 'API Reference' },
    { id: 'optimize', label: 'Optimization' }
];

const HowItWorks: React.FC<{ isVisible: boolean, onHome: () => void }> = ({ isVisible, onHome }) => {
    const [activeSection, setActiveSection] = useState('arch');

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#0f172a',
            color: '#e2e8f0',
            overflowY: 'auto',
            padding: '20px',
            fontFamily: 'Inter, sans-serif',
            zIndex: 9999
        }}>
            {/* Header */}
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                borderBottom: '1px solid #334155',
                paddingBottom: '20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', color: '#38bdf8' }}>BoxCric Developer Guide</h1>
                    <p style={{ margin: '5px 0 0', color: '#94a3b8' }}>Polling Architecture & API Reference</p>
                </div>
                <button
                    onClick={onHome}
                    style={{
                        background: '#334155',
                        border: 'none',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    Close Guide
                </button>
            </div>

            {/* Navigation */}
            <div style={{ maxWidth: '800px', margin: '0 auto 30px', display: 'flex', gap: '10px' }}>
                {SECTIONS.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        style={{
                            background: activeSection === s.id ? '#38bdf8' : '#1e293b',
                            color: activeSection === s.id ? '#0f172a' : '#94a3b8',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Content Container */}
            <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>

                {/* 1. ARCHITECTURE */}
                {activeSection === 'arch' && (
                    <div>
                        <h2 style={{ color: '#bae6fd' }}>The "TV News" Architecture</h2>
                        <p>The app uses a <b>Dual-Engine Polling</b> strategy to balance freshness with performance.</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '30px 0' }}>
                            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #01579b' }}>
                                <h3 style={{ margin: '0 0 10px', color: '#7dd3fc' }}>📺 Engine A: "News Ticker"</h3>
                                <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
                                    <b>Job:</b> Updates the Home Page list.<br />
                                    <b>Speed:</b> Slow (15s)<br />
                                    <b>State:</b> Always On<br />
                                    <b>File:</b> <code>useCricketData.ts</code>
                                </p>
                            </div>
                            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #ea580c' }}>
                                <h3 style={{ margin: '0 0 10px', color: '#fdba74' }}>🎥 Engine B: "Live Broadcast"</h3>
                                <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
                                    <b>Job:</b> Updates ONE active match.<br />
                                    <b>Speed:</b> Fast (10s)<br />
                                    <b>State:</b> On Demand (Only when visible)<br />
                                    <b>File:</b> <code>App.tsx</code>
                                </p>
                            </div>
                        </div>

                        <div style={{ background: '#334155', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #4ade80' }}>
                            <h4 style={{ margin: '0 0 5px', color: '#4ade80' }}>💡 The Safety Switch</h4>
                            <p style={{ margin: 0, fontSize: '14px' }}>
                                If you navigate away from a match (e.g. open a Series page), Engine B <b>STOPS immediately</b>.
                                It only restarts when the match becomes the top-most view again.
                            </p>
                        </div>
                    </div>
                )}

                {/* 2. FLOWS (Visualized) */}
                {activeSection === 'flows' && (
                    <div>
                        <h2 style={{ color: '#bae6fd' }}>Data Flow Visualization</h2>

                        <h3 style={{ marginTop: '30px' }}>1. The Active Loop</h3>
                        <div style={{
                            background: '#1e293b',
                            padding: '30px',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <div style={{ padding: '10px 20px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>App.tsx (Check Stack)</div>
                            <div style={{ fontSize: '20px' }}>⬇️ (Is Top View?)</div>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ padding: '15px', background: '#0c4a6e', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontWeight: 'bold', color: '#7dd3fc' }}>Fetch Scorecard</div>
                                    <div style={{ fontSize: '12px' }}>scorecard_v2.json</div>
                                </div>
                                <div style={{ padding: '15px', background: '#0c4a6e', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontWeight: 'bold', color: '#7dd3fc' }}>Fetch Commentary</div>
                                    <div style={{ fontSize: '12px' }}>wallstream_v2.json</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '20px' }}>⬇️ (Props Pass)</div>
                            <div style={{ padding: '10px 20px', background: '#334155', borderRadius: '8px', width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
                                LiveDetail Component
                            </div>
                            <div style={{ fontSize: '20px' }}>⬇️ (Reactive Trigger)</div>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ padding: '10px', background: '#3f6212', borderRadius: '6px', fontSize: '13px' }}>Charts (OBO)</div>
                                <div style={{ padding: '10px', background: '#3f6212', borderRadius: '6px', fontSize: '13px' }}>Wagon Wheel</div>
                            </div>
                        </div>

                        <h3 style={{ marginTop: '30px' }}>2. The Sleep State</h3>
                        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
                            <p><b>User Action:</b> Open Series Page over Match</p>
                            <code style={{ display: 'block', padding: '15px', background: '#0f172a', borderRadius: '8px', color: '#f87171' }}>
                                App.tsx -> MatchView.isVisible = FALSE<br />
                                App.tsx -> setScorecard(NULL)<br /><br />
                                // Downstream Effect:<br />
                                LiveDetail -> Hooks DEPEND on scorecard<br />
                                LiveDetail -> Hooks STOP FIRING 🛑
                            </code>
                        </div>
                    </div>
                )}

                {/* 3. API REFERENCE */}
                {activeSection === 'api' && (
                    <div>
                        <h2 style={{ color: '#bae6fd' }}>Wisden API Reference</h2>
                        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Base: <code>https://www.wisden.com/</code> via Proxy</p>

                        <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                            <ApiCard
                                method="GET"
                                name="Matches List"
                                endpoint="/default.aspx?gamestate={1/2}"
                                desc="Live & Upcoming matches. Polled globally."
                            />
                            <ApiCard
                                method="GET"
                                name="Scorecard"
                                endpoint="/cricket/v1/game/scorecard?game_id=..."
                                desc="Full stats. Polled every 10s via Active Engine."
                            />
                            <ApiCard
                                method="GET"
                                name="Wallstream"
                                endpoint="/functions/wallstream/?match_id=..."
                                desc="Ball-by-ball commentary. Synced with Scorecard."
                            />
                            <ApiCard
                                method="GET"
                                name="Over-by-Over"
                                endpoint="/cricket/live/json/{id}_overbyover_{inn}.json"
                                desc="Static JSON for Manhattan/Worm charts."
                            />
                            <ApiCard
                                method="GET"
                                name="Batsman Splits"
                                endpoint="/cricket/live/json/{id}_batsman_splits_{inn}.json"
                                desc="Static JSON for Wagon Wheel."
                            />
                            <ApiCard
                                method="GET"
                                name="Head-to-Head"
                                endpoint="/cricket/v1/game/head-to-head?game_id=..."
                                desc="Historic stats for Win Probability."
                            />
                        </div>
                    </div>
                )}

                {/* 4. OPTIMIZATION */}
                {activeSection === 'optimize' && (
                    <div>
                        <h2 style={{ color: '#bae6fd' }}>Optimization Strategies</h2>
                        <p>Cost-saving measures implemented or planned.</p>

                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ marginBottom: '20px', background: '#1e293b', padding: '15px', borderRadius: '8px' }}>
                                <strong style={{ color: '#a7f3d0' }}>Dynamic Global Poll</strong><br />
                                If NO matches are live, the global poll slows from 15s to 2 minutes.
                            </li>
                            <li style={{ marginBottom: '20px', background: '#1e293b', padding: '15px', borderRadius: '8px' }}>
                                <strong style={{ color: '#a7f3d0' }}>Event-Driven Insights</strong><br />
                                Chart APIs are only fetched when the Over Count changes, not on every ball. Saves ~80%.
                            </li>
                            <li style={{ marginBottom: '20px', background: '#1e293b', padding: '15px', borderRadius: '8px' }}>
                                <strong style={{ color: '#a7f3d0' }}>HTTP Caching</strong><br />
                                Proxy passes <code>If-None-Match</code> headers to utilize edge caching.
                            </li>
                        </ul>
                    </div>
                )}

            </div>
        </div>
    );
};

const ApiCard = ({ method, name, endpoint, desc }: { method: string, name: string, endpoint: string, desc: string }) => (
    <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #38bdf8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <strong style={{ color: '#e2e8f0' }}>{name}</strong>
            <span style={{ fontSize: '12px', background: '#0f172a', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>{method}</span>
        </div>
        <code style={{ display: 'block', fontSize: '12px', color: '#7dd3fc', marginBottom: '8px', wordBreak: 'break-all' }}>{endpoint}</code>
        <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{desc}</div>
    </div>
);

export default HowItWorks;
