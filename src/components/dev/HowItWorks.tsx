import React from 'react';

const HowItWorks: React.FC<{ isVisible: boolean, onHome: () => void }> = ({ isVisible, onHome }) => {
    if (!isVisible) return null;

    // --- "Paper" Documentation Theme ---
    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        inset: 0,
        background: '#ffffff',
        color: '#111111',
        overflowY: 'auto',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        lineHeight: '1.6',
    };

    const contentStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '100px 40px 100px', // Top padding for fixed header
    };

    const h1Style: React.CSSProperties = {
        fontSize: '36px',
        fontWeight: 700,
        marginBottom: '20px',
        borderBottom: '2px solid #000',
        paddingBottom: '16px',
        letterSpacing: '-0.5px'
    };

    const h2Style: React.CSSProperties = {
        fontSize: '24px',
        fontWeight: 600,
        marginTop: '60px',
        marginBottom: '20px',
        borderBottom: '1px solid #eee',
        paddingBottom: '8px',
        color: '#000'
    };

    const h3Style: React.CSSProperties = {
        fontSize: '18px',
        fontWeight: 600,
        marginTop: '30px',
        marginBottom: '10px',
        color: '#333'
    };

    const pStyle: React.CSSProperties = {
        fontSize: '16px',
        marginBottom: '16px',
        color: '#333'
    };

    const tableStyle: React.CSSProperties = {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px',
        fontSize: '14px',
        marginBottom: '40px'
    };

    const thStyle: React.CSSProperties = {
        textAlign: 'left',
        borderBottom: '2px solid #000',
        padding: '12px 8px',
        fontWeight: 600
    };

    const tdStyle: React.CSSProperties = {
        borderBottom: '1px solid #ddd',
        padding: '12px 8px',
        color: '#333'
    };

    const codeBlockStyle: React.CSSProperties = {
        background: '#f5f5f5',
        padding: '20px',
        borderRadius: '4px',
        fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
        fontSize: '13px',
        overflowX: 'auto',
        border: '1px solid #ddd',
        marginBottom: '20px'
    };

    return (
        <div style={containerStyle}>
            <div style={contentStyle}>

                <h1 style={h1Style}>BoxCric Technical Specification</h1>
                <p style={pStyle}>
                    <strong>Version:</strong> 1.3.0 &nbsp;|&nbsp;
                    <strong>Date:</strong> {new Date().toLocaleDateString()}
                </p>
                <p style={pStyle}>
                    This document details the internal architecture, polling strategies, and data models for the BoxCric application. It is intended for engineering reference.
                </p>

                {/* 1. Component Responsibility */}
                <h2 style={h2Style}>1. Component Responsibility & Inversion of Control</h2>
                <p style={pStyle}>
                    The application uses an "Orchestrator-Consumer" pattern. The <code>LiveDetail</code> component does not fetch its own live data. This allows the parent <code>App.tsx</code> to pause network activity immediately when the view is obscured, without unmounting the heavy component.
                </p>

                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Component</th>
                            <th style={thStyle}>Role</th>
                            <th style={thStyle}>Responsibility</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={tdStyle}><strong>App.tsx</strong></td>
                            <td style={tdStyle}>Orchestrator</td>
                            <td style={tdStyle}>Manages the active match timer (10s). Fetches <code>Scorecard</code> and <code>Wallstream</code> data and passes it down via props.</td>
                        </tr>
                        <tr>
                            <td style={tdStyle}><strong>LiveDetail.tsx</strong></td>
                            <td style={tdStyle}>Renderer</td>
                            <td style={tdStyle}>Pure consumer of props. Only fetches static assets (Charts, H2H) on mount. Does not hold a live polling interval.</td>
                        </tr>
                        <tr>
                            <td style={tdStyle}><strong>useCricketData.ts</strong></td>
                            <td style={tdStyle}>Store</td>
                            <td style={tdStyle}>Background worker. Polls the global match list via <code>Engine A</code> (15s). Maintains the "matches" source of truth.</td>
                        </tr>
                    </tbody>
                </table>

                {/* 2. Priority Logic */}
                <h2 style={h2Style}>2. Match Priority Algorithm</h2>
                <p style={pStyle}>
                    To support deep linking and navigation consistency, match data is bucketed and merged using the following precedence rules in <code>recomputeMatches()</code>.
                </p>

                <div style={{ marginBottom: '30px', paddingLeft: '20px', borderLeft: '4px solid #eee' }}>
                    <h3 style={h3Style}>Priority 1: Live Bucket (Highest)</h3>
                    <p style={pStyle}>Fetched via <code>gamestate=1</code>. Overwrites all other data. Flushed and replaced every 15 seconds.</p>

                    <h3 style={h3Style}>Priority 2: Upcoming Bucket</h3>
                    <p style={pStyle}>Fetched via <code>gamestate=2</code>. Overwrites "Completed" data if ID collisions occur.</p>

                    <h3 style={h3Style}>Priority 3: Completed Bucket (Base)</h3>
                    <p style={pStyle}>Fetched via date-range query. lowest priority. Acts as the historical record.</p>
                </div>


                {/* 3. API Reference */}
                <h2 style={h2Style}>3. API Service Inventory</h2>
                <p style={pStyle}>All requests routed via Cloudflare Worker for CORS handling.</p>

                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Method</th>
                            <th style={thStyle}>Endpoint Path</th>
                            <th style={thStyle}>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={tdStyle}><code>GET</code></td>
                            <td style={tdStyle}><code>/default.aspx?methodtype=3</code></td>
                            <td style={tdStyle}>Global Match List. <code>gamestate</code> param filters Live/Upcoming.</td>
                        </tr>
                        <tr>
                            <td style={tdStyle}><code>GET</code></td>
                            <td style={tdStyle}><code>/cricket/v1/game/scorecard</code></td>
                            <td style={tdStyle}>Full Scorecard JSON. Heavy payload (Players, Innings).</td>
                        </tr>
                        <tr>
                            <td style={tdStyle}><code>GET</code></td>
                            <td style={tdStyle}><code>/functions/wallstream/</code></td>
                            <td style={tdStyle}>Ball-by-ball commentary lines.</td>
                        </tr>
                        <tr>
                            <td style={tdStyle}><code>GET</code></td>
                            <td style={tdStyle}><code>/cricket/live/json/_overbyover.json</code></td>
                            <td style={tdStyle}>Static asset for Graphs. Cached on edge.</td>
                        </tr>
                    </tbody>
                </table>

                {/* 4. Win Probability */}
                <h2 style={h2Style}>4. Win Probability Model</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>

                    <div>
                        <h3 style={h3Style}>1st Innings: Dynamic Par</h3>
                        <p style={pStyle}>Calculates probability based on Projected Score vs Dynamic Par.</p>
                        <pre style={codeBlockStyle}>
                            Projected = Runs + (CRR * OversLeft * Resources)
                            Par = Base (165/180) + PitchAdj + StrengthDiff
                            Delta = Projected - Par
                            Prob = 50 + (Delta * 0.5)
                        </pre>
                    </div>

                    <div>
                        <h3 style={h3Style}>2nd Innings: RRR Pressure</h3>
                        <p style={pStyle}>Calculates probability based on Required Run Rate thresholds (Format aware).</p>
                        <pre style={codeBlockStyle}>
IF RRR &gt; 13 (T20) -> Win Prob = 5%
IF RRR &gt; 10 (T20) -> Win Prob = 20%
IF RRR &lt; 6 (T20)  -> Win Prob = 80%

                            * Death Penalty applied if Overs left &lt; 5
                        </pre>
                    </div>

                </div>

                {/* 5. Logic */}
                <h2 style={h2Style}>5. Dynamic Chip Logic</h2>
                <p style={pStyle}>
                    Filter chips in <code>UpcomingListPage</code> are derived state, not hardcoded constants.
                </p>
                <div style={codeBlockStyle}>
                    {`// Pseudo-code for Chip Generation
function generateChips(matches) {
    const types = new Set();
    matches.forEach(m => {
        types.add(m.League);
        types.add(m.Format);
    });
    return Array.from(types).map(t => createChip(t));
}`}
                </div>

                <div style={{ marginTop: '80px', borderTop: '1px solid #ddd', paddingTop: '20px', fontSize: '12px', color: '#666' }}>
                    Confidential Internal Document · BoxCric Engineering
                </div>

            </div>
        </div>
    );
};

export default HowItWorks;
