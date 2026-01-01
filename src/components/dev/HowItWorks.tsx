import React, { useState } from 'react';
import { LuServer, LuDatabase, LuWorkflow, LuLayers, LuCpu, LuNetwork, LuShield, LuZap } from 'react-icons/lu';

const HowItWorks: React.FC<{ isVisible: boolean, onHome: () => void }> = ({ isVisible, onHome }) => {
    if (!isVisible) return null;

    // --- Styles ---
    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        inset: 0,
        background: '#09090b', // Zinc-950
        color: '#e4e4e7', // Zinc-200
        overflowY: 'auto',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
    };

    const contentStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
        padding: '120px 40px 100px', // Top padding for header
        lineHeight: '1.6',
    };

    const sectionHeaderStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        marginTop: '64px',
        borderBottom: '1px solid #27272a',
        paddingBottom: '16px',
    };

    const h2Style: React.CSSProperties = {
        fontSize: '24px',
        fontWeight: 600,
        color: '#f4f4f5', // Zinc-100
        letterSpacing: '-0.02em',
        margin: 0,
    };

    const pStyle: React.CSSProperties = {
        fontSize: '15px',
        color: '#a1a1aa', // Zinc-400
        marginBottom: '16px',
    };

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginTop: '24px',
    };

    return (
        <div style={containerStyle}>
            <div style={contentStyle}>

                {/* Header */}
                <div style={{ marginBottom: '60px' }}>
                    <div style={{
                        fontSize: '12px', fontWeight: 600, color: '#3b82f6', letterSpacing: '0.05em',
                        textTransform: 'uppercase', marginBottom: '12px'
                    }}>Technical Specification</div>
                    <h1 style={{ fontSize: '40px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.1' }}>
                        BoxCric Architecture
                    </h1>
                    <p style={{ fontSize: '18px', color: '#a1a1aa', marginTop: '16px', maxWidth: '600px' }}>
                        Deep dive into the dual-engine polling system, proxy infrastructure, and data tiers powering the application.
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                        <Tag label="v1.2.0" color="#3b82f6" />
                        <Tag label="React 18" color="#a1a1aa" />
                        <Tag label="Cloudflare Workers" color="#f59e0b" />
                        <Tag label="Supabase" color="#10b981" />
                    </div>
                </div>

                {/* 1. High Level Architecture */}
                <section>
                    <div style={sectionHeaderStyle}>
                        <LuLayers color="#3b82f6" size={24} />
                        <h2 style={h2Style}>System Architecture</h2>
                    </div>
                    <p style={pStyle}>
                        The application implements a <b>split-state architecture</b> to isolate high-frequency match polling from global application state. This ensures "background" matches do not consume resources while keeping the main navigation responsive.
                    </p>

                    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '32px', margin: '32px 0' }}>
                        <div style={{ marginBottom: '24px', textAlign: 'center', fontSize: '13px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data Flow Diagram</div>
                        {/* CSS Drawing of Architecture */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center', position: 'relative' }}>
                            {/* Client Layer */}
                            <div style={{ display: 'flex', gap: '40px', width: '100%', justifyContent: 'center' }}>
                                <NodeBox title="Engine A: Global" sub="useCricketData.ts" color="#3b82f6" />
                                <NodeBox title="Engine B: Active" sub="LiveDetail.tsx" color="#f59e0b" />
                            </div>

                            {/* Network Layer */}
                            <div style={{ width: '2px', height: '40px', background: '#27272a' }}></div>
                            <NodeBox title="CORS Proxy" sub="Cloudflare Worker" color="#8b5cf6" wide />

                            {/* Service Layer */}
                            <div style={{ width: '2px', height: '40px', background: '#27272a' }}></div>
                            <div style={{ display: 'flex', gap: '40px', width: '100%', justifyContent: 'center' }}>
                                <NodeBox title="Wisden API" sub="Primary Data Source" color="#10b981" />
                                <NodeBox title="Supabase" sub="Historical / Form" color="#ec4899" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. API Service Layer */}
                <section>
                    <div style={sectionHeaderStyle}>
                        <LuNetwork color="#8b5cf6" size={24} />
                        <h2 style={h2Style}>API Service Layer</h2>
                    </div>
                    <p style={pStyle}>
                        The application aggregates data from two primary upstream services. All requests are routed through a managed CORS proxy to handle headers and caching.
                    </p>

                    <div style={gridStyle}>
                        <ServiceCard
                            icon={<LuDatabase size={20} color="#10b981" />}
                            title="Wisden (Live)"
                            desc="Real-time match data, scorecards, and commentary."
                        >
                            <Endpoint method="GET" path="/default.aspx" desc="Method: 3 (Matches)" />
                            <Endpoint method="GET" path="/cricket/v1/game/scorecard" desc="Full Scorecard JSON" />
                            <Endpoint method="GET" path="/functions/wallstream" desc="Ball-by-Ball Commentary" />
                            <Endpoint method="GET" path="/cricket/live/json/*" desc="Static JSON Assets (Charts)" />
                        </ServiceCard>

                        <ServiceCard
                            icon={<LuShield size={20} color="#ec4899" />}
                            title="Supabase (History)"
                            desc="Long-term storage for team form, H2H, and league stats."
                        >
                            <Endpoint method="SELECT" path="matches" desc="Team Form (Last 5)" />
                            <Endpoint method="SELECT" path="matches" desc="Head-to-Head Records" />
                            <Endpoint method="SELECT" path="matches" desc="League Filtering" />
                        </ServiceCard>
                    </div>
                </section>

                {/* 3. Data Models */}
                <section>
                    <div style={sectionHeaderStyle}>
                        <LuCode color="#f59e0b" size={24} />
                        <h2 style={h2Style}>Core Data Models</h2>
                    </div>
                    <p style={pStyle}>
                        TypeScript definitions ensuring type safety across the dual-engine boundary.
                    </p>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #27272a' }}>
                                <th style={{ padding: '12px 0', color: '#71717a', fontWeight: 500 }}>Interface</th>
                                <th style={{ padding: '12px 0', color: '#71717a', fontWeight: 500 }}>Key Properties</th>
                                <th style={{ padding: '12px 0', color: '#71717a', fontWeight: 500 }}>Usage</th>
                            </tr>
                        </thead>
                        <tbody>
                            <ModelRow
                                name="Match"
                                props="game_id, event_state, participants, status_text"
                                usage="Global List, Home Page"
                            />
                            <ModelRow
                                name="Scorecard"
                                props="Innings[], Teams{}, Players{}"
                                usage="LiveDetail, Score Views"
                            />
                            <ModelRow
                                name="WallstreamData"
                                props="balls[], latestBall, commentary"
                                usage="Commentary Feed, Header Ticker"
                            />
                            <ModelRow
                                name="H2HData"
                                props="team.head_to_head, venue_stats"
                                usage="Match Insights, Pre-game Analysis"
                            />
                        </tbody>
                    </table>
                </section>

                {/* 4. Logic & Optimization */}
                <section>
                    <div style={sectionHeaderStyle}>
                        <LuCpu color="#ef4444" size={24} />
                        <h2 style={h2Style}>Logic & Optimization</h2>
                    </div>

                    <div style={gridStyle}>
                        <LogicCard
                            title="Viewport Throttling"
                            desc="Engine B (Live) subscribes to the browser's Page Visibility API. If the tab is backgrounded or the user navigates to a Series view, the poll halts immediately (App.tsx:304)."
                        />
                        <LogicCard
                            title="Event-Driven Charts"
                            desc="Static assets like Wagon Wheels are not polled on a timer. They are fetched only when the 'Over Count' increments in the Scorecard stream, reducing redundant calls by ~90%."
                        />
                        <LogicCard
                            title="Preload Injection"
                            desc="Critical match data is pre-fetched server-side (or via script injection) into window.__preloadData, allowing the React hydration to skip the initial RTT."
                        />
                    </div>
                </section>

                {/* Footer */}
                <div style={{ marginTop: '80px', borderTop: '1px solid #27272a', paddingTop: '40px', fontSize: '13px', color: '#52525b', display: 'flex', justifyContent: 'space-between' }}>
                    <div>BoxCric Engineering</div>
                    <div>Generated: {new Date().toLocaleDateString()}</div>
                </div>

            </div>
        </div>
    );
};

// --- Components ---

const Tag = ({ label, color }: any) => (
    <div style={{
        fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px',
        background: `${color}15`, color: color, border: `1px solid ${color}30`
    }}>{label}</div>
);

const NodeBox = ({ title, sub, color, wide }: any) => (
    <div style={{
        width: wide ? '240px' : '180px', padding: '16px', background: '#18181b',
        border: `1px solid ${color || '#52525b'}`, borderRadius: '8px', textAlign: 'center',
        boxShadow: `0 4px 20px -10px ${color}30`
    }}>
        <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>{sub}</div>
    </div>
);

const ServiceCard = ({ title, desc, icon, children }: any) => (
    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            {icon}
            <div style={{ fontWeight: 600, color: '#fff' }}>{title}</div>
        </div>
        <div style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '24px' }}>{desc}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {children}
        </div>
    </div>
);

const Endpoint = ({ method, path, desc }: any) => (
    <div style={{ fontSize: '12px', display: 'grid', gridTemplateColumns: '40px 1fr', gap: '8px', alignItems: 'baseline' }}>
        <span style={{ color: '#71717a', fontWeight: 600 }}>{method}</span>
        <div>
            <div style={{ fontFamily: 'monospace', color: '#e4e4e7' }}>{path}</div>
            <div style={{ color: '#52525b' }}>{desc}</div>
        </div>
    </div>
);

const ModelRow = ({ name, props, usage }: any) => (
    <tr style={{ borderBottom: '1px solid #27272a' }}>
        <td style={{ padding: '16px 0', fontFamily: 'monospace', color: '#f59e0b' }}>{name}</td>
        <td style={{ padding: '16px 0', color: '#d4d4d8', fontSize: '13px', fontFamily: 'monospace' }}>{props}</td>
        <td style={{ padding: '16px 0', color: '#a1a1aa', fontSize: '13px' }}>{usage}</td>
    </tr>
);

const LogicCard = ({ title, desc }: any) => (
    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '20px' }}>
        <div style={{ color: '#e4e4e7', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>{title}</div>
        <div style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.6' }}>{desc}</div>
    </div>
);

export default HowItWorks;
