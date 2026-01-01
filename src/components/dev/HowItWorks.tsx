import React from 'react';
import { LuServer, LuZap, LuActivity, LuDatabase, LuCode, LuLayers, LuCpu } from 'react-icons/lu';

const HowItWorks: React.FC<{ isVisible: boolean, onHome: () => void }> = ({ isVisible, onHome }) => {
    if (!isVisible) return null;

    // --- Styles ---
    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        inset: 0,
        background: '#0f0f0f', // Deep dark background
        color: '#e5e5e5', // Soft white text
        overflowY: 'auto',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        zIndex: 2000, // Below FloatingHeader (3000)
    };

    const contentStyle: React.CSSProperties = {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '120px 24px 60px', // Top padding to clear FloatingHeader (85px)
        lineHeight: '1.7',
    };

    const sectionStyle: React.CSSProperties = {
        marginBottom: '60px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        paddingBottom: '40px',
    };

    const h1Style: React.CSSProperties = {
        fontSize: '32px',
        fontWeight: 800,
        background: 'linear-gradient(to right, #60a5fa, #a78bfa)', // Blue to Purple gradient
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '16px',
        letterSpacing: '-0.02em',
    };

    const h2Style: React.CSSProperties = {
        fontSize: '24px',
        fontWeight: 600,
        color: '#f8fafc',
        marginTop: '40px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    };

    const pStyle: React.CSSProperties = {
        fontSize: '16px',
        color: '#94a3b8', // Slate-400
        marginBottom: '20px',
    };

    const cardStyle: React.CSSProperties = {
        background: 'rgba(30, 41, 59, 0.5)', // Slate-800 with opacity
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
    };

    return (
        <div style={containerStyle}>
            <div style={contentStyle}>

                {/* Intro Section */}
                <section style={sectionStyle}>
                    <h1 style={h1Style}>Developer Documentation</h1>
                    <p style={pStyle}>
                        BoxCric is built on a high-performance, dual-engine polling architecture designed to deliver real-time cricket scores while minimizing API costs and latency.
                        This guide explains the internal logic, data flows, and API integrations.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                        <StatusBadge label="React" color="#0ea5e9" />
                        <StatusBadge label="TypeScript" color="#3178c6" />
                        <StatusBadge label="Firebase" color="#f59e0b" />
                    </div>
                </section>

                {/* 1. Architecture */}
                <section style={sectionStyle}>
                    <h2 style={h2Style}>
                        <span style={{ color: '#38bdf8' }}>01</span>
                        Polling Architecture
                    </h2>
                    <p style={pStyle}>
                        The app treats data fetching like a <b>TV Network</b>. We split the workload into two distinct engines to balance "Global Awareness" with "Local Real-Time Updates".
                    </p>

                    {/* Diagram / Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '30px' }}>
                        <ArchitectureCard
                            title="Engine A: The News Ticker"
                            icon={<LuServer size={24} color="#38bdf8" />}
                            role="Updates Home Page Layout"
                            speed="Slow (15s)"
                            status="Always On"
                            desc="Runs globally (useCricketData.ts) to ensure the match list is always fresh, even when navigating menus."
                        />
                        <ArchitectureCard
                            title="Engine B: The Live Broadcast"
                            icon={<LuZap size={24} color="#fbbf24" />}
                            role="Updates Match Detail"
                            speed="Fast (10s)"
                            status="On Demand"
                            desc="Runs only when a specific match is active (LiveDetail.tsx). Pauses instantly when navigating away to save bandwidth."
                        />
                    </div>

                    <h3 style={{ fontSize: '18px', color: '#e2e8f0', marginTop: '60px', marginBottom: '15px', fontWeight: 600 }}>The "Safety Switch" Logic</h3>
                    <p style={pStyle}>
                        To prevent API abuse, Engine B (High Frequency) is strictly controlled by a visibility lock in <code>App.tsx</code>.
                    </p>
                    <CodeBlock
                        label="App.tsx Logic"
                        code={`
// Check if user is looking at a match
const isMatchVisible = currentView.type === 'MATCH';

// IF visible -> Run 10s Poll
// ELSE -> setScorecard(null) && STOP Poll 🛑
`}
                    />
                </section>

                {/* 2. API Reference */}
                <section style={sectionStyle}>
                    <h2 style={h2Style}>
                        <span style={{ color: '#a78bfa' }}>02</span>
                        API Reference
                    </h2>
                    <p style={pStyle}>
                        All requests are routed through a CORS proxy to Wisden's backend.
                    </p>

                    <ApiEndpoint
                        method="GET"
                        path="/default.aspx?gamestate={1/2}"
                        desc="Global Match List. Fetched by Engine A."
                    />
                    <ApiEndpoint
                        method="GET"
                        path="/cricket/v1/game/scorecard?game_id={id}"
                        desc="Full Scorecard. Sources the Lineups, Scores, and Partnership data."
                    />
                    <ApiEndpoint
                        method="GET"
                        path="/functions/wallstream/?match_id={id}"
                        desc="Ball-by-Ball Commentary. Synced to the Scorecard poll."
                    />
                    <ApiEndpoint
                        method="GET"
                        path="/cricket/live/json/{id}_overbyover_{inn}.json"
                        desc="Static JSON for Manhattan/Worm charts. Only fetched when 'Over Count' changes."
                    />
                </section>

                {/* 3. Optimizations */}
                <section style={{ ...sectionStyle, borderBottom: 'none' }}>
                    <h2 style={h2Style}>
                        <span style={{ color: '#34d399' }}>03</span>
                        Optimization & Performance
                    </h2>
                    <p style={pStyle}>
                        Cost-saving measures implemented to keep the app sustainable.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <OptimizationItem
                            title="Dynamic Global Poll"
                            desc="If 0 live matches are detected, the global poll slows down from 15s to 2 minutes automatically."
                        />
                        <OptimizationItem
                            title="Event-Driven Charts"
                            desc="Chart APIs are expensive. We only fetch them when the Over Number changes (e.g. 14.6 -> 15.0), reducing calls by 80%."
                        />
                        <OptimizationItem
                            title="Header Caching"
                            desc="The proxy passes 'If-None-Match' headers to utilize edge caching for static assets like player images."
                        />
                    </div>
                </section>

                {/* Footer */}
                <div style={{ marginTop: '80px', textAlign: 'center', opacity: 0.4, fontSize: '12px' }}>
                    BoxCric Developer Guide · v1.0
                </div>

            </div>
        </div>
    );
};

// --- Sub-components for Clean Layout ---

const ArchitectureCard = ({ title, icon, role, speed, status, desc }: any) => (
    <div style={{
        background: '#151b28', // Darker slate
        borderRadius: '8px', // Sharper corners for pro feel
        padding: '32px',
        border: '1px solid rgba(255,255,255,0.08)'
    }}>
        <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'inline-block' }}>{icon}</div>
        <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '12px', fontWeight: 600 }}>{title}</h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>{desc}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div style={{ background: '#0b1120', padding: '12px', borderRadius: '4px', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>ROLE</div>
                {role}
            </div>
            <div style={{ background: '#0b1120', padding: '12px', borderRadius: '4px', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>SPEED</div>
                {speed}
            </div>
        </div>
    </div>
);

const ApiEndpoint = ({ method, path, desc }: any) => (
    <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(56, 189, 248, 0.2)', // Subtle blue border
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
                background: '#0c4a6e', color: '#38bdf8',
                fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px'
            }}>{method}</span>
            <code style={{ fontSize: '13px', color: '#e2e8f0', fontFamily: 'monospace' }}>{path}</code>
        </div>
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>{desc}</div>
    </div>
);

const CodeBlock = ({ label, code }: any) => (
    <div style={{ marginTop: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
        <div style={{ background: '#1e293b', padding: '8px 16px', fontSize: '12px', color: '#cbd5e1', borderBottom: '1px solid #334155' }}>
            {label}
        </div>
        <div style={{ background: '#0f172a', padding: '16px', overflowX: 'auto' }}>
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', color: '#a5b4fc' }}>
                {code.trim()}
            </pre>
        </div>
    </div>
);

const OptimizationItem = ({ title, desc }: any) => (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{
            minWidth: '24px', height: '24px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px'
        }}>
            <LuActivity size={14} />
        </div>
        <div>
            <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>{title}</div>
            <div style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>{desc}</div>
        </div>
    </div>
);

const StatusBadge = ({ label, color }: any) => (
    <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
        background: `${color}20`,
        color: color,
        border: `1px solid ${color}40`
    }}>
        {label}
    </span>
);

export default HowItWorks;
