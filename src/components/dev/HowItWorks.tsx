import React, { useState } from 'react';
import { LuServer, LuDatabase, LuWorkflow, LuLayers, LuCpu, LuNetwork, LuShield, LuZap, LuGitBranch, LuCalculator, LuFilter } from 'react-icons/lu';

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
                    }}>Deep Dive Specification</div>
                    <h1 style={{ fontSize: '40px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.1' }}>
                        BoxCric Engineering Core
                    </h1>
                    <p style={{ fontSize: '18px', color: '#a1a1aa', marginTop: '16px', maxWidth: '600px' }}>
                        Comprehensive breakdown of the polling engines, priority algorithms, and win probability mathematics.
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                        <Tag label="v1.3.0" color="#3b82f6" />
                        <Tag label="Dual Engine" color="#10b981" />
                        <Tag label="Algorithm" color="#f59e0b" />
                    </div>
                </div>

                {/* 1. Component Responsibility */}
                <section>
                    <div style={sectionHeaderStyle}>
                        <LuLayers color="#3b82f6" size={24} />
                        <h2 style={h2Style}>Component Responsibility</h2>
                    </div>
                    <p style={pStyle}>
                        Contrary to typical patterns, <code>LiveDetail.tsx</code> is a <b>dumb consumer</b>. It does NOT poll the API itself.
                        This inversion of control is critical for the "Background Pause" feature.
                    </p>

                    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0', overflow: 'hidden', margin: '32px 0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead style={{ background: '#27272a', color: '#fff' }}>
                                <tr>
                                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>Component</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>Role</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>Polling Responsibility</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #27272a' }}>
                                    <td style={{ padding: '16px 20px', color: '#60a5fa', fontWeight: 600 }}>App.tsx</td>
                                    <td style={{ padding: '16px 20px', color: '#d4d4d8' }}>The Orchestrator</td>
                                    <td style={{ padding: '16px 20px', color: '#a1a1aa' }}>
                                        <b>Runs the Timer.</b> Fetches Scorecard & Wallstream every 10s. Passes data *down* to LiveDetail.
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #27272a' }}>
                                    <td style={{ padding: '16px 20px', color: '#f59e0b', fontWeight: 600 }}>LiveDetail.tsx</td>
                                    <td style={{ padding: '16px 20px', color: '#d4d4d8' }}>The Renderer</td>
                                    <td style={{ padding: '16px 20px', color: '#a1a1aa' }}>
                                        <b>Passive.</b> Only fetches static assets (H2H, Charts) <i>once</i> on mount. Does NOT poll.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '16px 20px', color: '#10b981', fontWeight: 600 }}>useCricketData.ts</td>
                                    <td style={{ padding: '16px 20px', color: '#d4d4d8' }}>The Store</td>
                                    <td style={{ padding: '16px 20px', color: '#a1a1aa' }}>
                                        <b>Background Worker.</b> Polls the Global Match List (Engine A) every 15s.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 2. Priority Algorithm */}
                <section>
                    <div style={sectionHeaderStyle}>
                        <LuGitBranch color="#8b5cf6" size={24} />
                        <h2 style={h2Style}>Match Priority Algorithm</h2>
                    </div>
                    <p style={pStyle}>
                        The <code>recomputeMatches()</code> function uses a <b>Bucket Merge Strategy</b> to ensure data consistency without "ghost" records.
                    </p>

                    <div style={gridStyle}>
                        <LogicCard
                            title="Priority 1: LIVE (Source of Truth)"
                            desc="Matches with state 'Live' or 'In Progress' overwrite everything else. This bucket is flushed and replaced every 15s."
                        />
                        <LogicCard
                            title="Priority 2: UPCOMING"
                            desc="Fetched with gamestate=2. Overwrites 'Completed' data if there is an ID collision (e.g. a match moved from scheduled to delay)."
                        />
                        <LogicCard
                            title="Priority 3: COMPLETED"
                            desc="The base layer. Fetched infrequently (5 mins). Contains results. If a match exists here but also in 'Live', 'Live' wins."
                        />
                    </div>
                </section>

                {/* 3. Logic: Win Probability */}
                <section>
                    <div style={sectionHeaderStyle}>
                        <LuCalculator color="#ef4444" size={24} />
                        <h2 style={h2Style}>Win Probability Logic</h2>
                    </div>
                    <p style={pStyle}>
                        Calculations in <code>winProbability.ts</code>. The model switches modes based on the innings.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#18181b', padding: '24px', borderRadius: '8px', border: '1px solid #27272a' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '20px', alignItems: 'start', borderBottom: '1px solid #27272a', paddingBottom: '20px' }}>
                            <div style={{ color: '#60a5fa', fontWeight: 600 }}>1st Innings</div>
                            <div>
                                <div style={{ color: '#fff', fontWeight: 500, marginBottom: '4px' }}>Dynamic Par Score Model</div>
                                <div style={{ color: '#a1a1aa', fontSize: '14px' }}>
                                    <code>Projected Score = Current Runs + (CRR × OversRemaining × ResourceFactor)</code>
                                    <br /><br />
                                    We compare Projected vs <b>Dynamic Par</b>.
                                    <br />
                                    <i>Dynamic Par = Base (165) + Pitch Adj + (Batting Strength - Bowling Strength)</i>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '20px', alignItems: 'start' }}>
                            <div style={{ color: '#f59e0b', fontWeight: 600 }}>2nd Innings</div>
                            <div>
                                <div style={{ color: '#fff', fontWeight: 500, marginBottom: '4px' }}>RRR Pressure Matrix</div>
                                <div style={{ color: '#a1a1aa', fontSize: '14px' }}>
                                    Probability is defined by Required Run Rate thresholds:
                                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                        <li>RRR &gt; 13.0 (T20) → <b>5% Win Prob</b></li>
                                        <li>RRR &gt; 10.0 (T20) → <b>20% Win Prob</b></li>
                                        <li>RRR &lt; 6.0 (T20) → <b>80% Win Prob</b></li>
                                    </ul>
                                    <div style={{ marginTop: '8px', color: '#ef4444' }}>
                                        <b>Death Penalty:</b> If overs &lt; 5 and RRR &gt; 12, probability decays exponentially.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Dynamic Chips */}
                <section>
                    <div style={sectionHeaderStyle}>
                        <LuFilter color="#10b981" size={24} />
                        <h2 style={h2Style}>Dynamic Filter Chips</h2>
                    </div>
                    <p style={pStyle}>
                        Inside <code>UpcomingListPage.tsx</code>, filter chips are not hardcoded. They are <b>Derived State</b>.
                    </p>
                    <CodeBlock
                        label="Generation Logic"
                        code={`
// 1. Filter Matches by selected Month (Time Chip)
const validMatches = matches.filter(m => m.date === selectedMonth);

// 2. Iterate valid matches and extract unique properties
const types = new Set();
validMatches.forEach(m => {
   types.add(m.LeagueName);   // e.g. "IPL"
   types.add(m.Team1);        // e.g. "India"
   types.add(m.MatchFormat);  // e.g. "T20"
});

// 3. Render Chips
// Result: Users only see chips relevant to the *current* month.
`}
                    />
                </section>

                {/* 5. API Clarification */}
                <section>
                    <div style={sectionHeaderStyle}>
                        <LuNetwork color="#ec4899" size={24} />
                        <h2 style={h2Style}>API "Gamestate" Clarified</h2>
                    </div>
                    <p style={pStyle}>
                        The app uses <b>Method Types</b> (Wisden legacy param) to request different datasets.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ background: '#1f2937', padding: '16px', borderRadius: '6px', border: '1px solid #374151' }}>
                            <div style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase' }}>Method Type 3</div>
                            <div style={{ color: '#fff', fontWeight: 600, marginTop: '4px' }}>Global Match List</div>
                            <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>The master list of all matches.</div>
                        </div>
                        <div style={{ background: '#1f2937', padding: '16px', borderRadius: '6px', border: '1px solid #374151' }}>
                            <div style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase' }}>Gamestate Param</div>
                            <div style={{ color: '#fff', fontWeight: 600, marginTop: '4px' }}>1=Live, 2=Upcoming, 3=Result</div>
                            <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>Filters the global list response.</div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <div style={{ marginTop: '80px', borderTop: '1px solid #27272a', paddingTop: '40px', fontSize: '13px', color: '#52525b', display: 'flex', justifyContent: 'space-between' }}>
                    <div>BoxCric Engineering Core v1.3</div>
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

const LogicCard = ({ title, desc }: any) => (
    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '20px' }}>
        <div style={{ color: '#e4e4e7', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>{title}</div>
        <div style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.6' }}>{desc}</div>
    </div>
);

const CodeBlock = ({ label, code }: any) => (
    <div style={{ marginTop: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
        <div style={{ background: '#1e293b', padding: '8px 16px', fontSize: '12px', color: '#cbd5e1', borderBottom: '1px solid #334155' }}>
            {label}
        </div>
        <div style={{ background: '#0f172a', padding: '16px', overflowX: 'auto' }}>
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', color: '#a5b4fc', lineHeight: '1.5' }}>
                {code.trim()}
            </pre>
        </div>
    </div>
);

export default HowItWorks;
