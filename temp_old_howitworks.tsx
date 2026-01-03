import React from 'react';

/**
 * BoxCric Technical Specification v2.0
 * Complete Engineering Documentation
 * 
 * Sections:
 * 1. System Overview
 * 2. API Inventory
 * 3. Page → API Mapping
 * 4. Data Flow Diagrams
 * 5. Priority Algorithm
 * 6. Win Probability Model
 * 7. Dynamic Filter Logic
 * 8. Deep Parameter Tracing
 * 9. File Role Matrix
 */

const HowItWorks: React.FC<{ isVisible: boolean, onHome: () => void }> = ({ isVisible, onHome }) => {
    if (!isVisible) return null;

    // Styles
    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        inset: 0,
        background: '#ffffff',
        color: '#111111',
        overflowY: 'auto',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        zIndex: 2000,
        lineHeight: '1.6',
        userSelect: 'text',
        WebkitUserSelect: 'text',
    };

    const contentStyle: React.CSSProperties = {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '100px 40px 100px',
    };

    const h1 = { fontSize: '32px', fontWeight: 700, marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '16px' };
    const h2 = { fontSize: '22px', fontWeight: 600, marginTop: '60px', marginBottom: '16px', borderBottom: '1px solid #ccc', paddingBottom: '8px' };
    const h3 = { fontSize: '17px', fontWeight: 600, marginTop: '30px', marginBottom: '10px', color: '#333' };
    const p = { fontSize: '15px', marginBottom: '16px', color: '#333' };
    const code = { background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '13px' };
    const pre = { background: '#f5f5f5', padding: '16px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', overflowX: 'auto' as const, border: '1px solid #ddd', marginBottom: '20px', whiteSpace: 'pre' as const };
    const table = { width: '100%', borderCollapse: 'collapse' as const, marginTop: '16px', marginBottom: '30px', fontSize: '13px' };
    const th = { textAlign: 'left' as const, borderBottom: '2px solid #000', padding: '10px 8px', fontWeight: 600 };
    const td = { borderBottom: '1px solid #ddd', padding: '10px 8px', color: '#333', verticalAlign: 'top' as const };

    return (
        <div style={containerStyle}>
            <div style={contentStyle}>

                <h1 style={h1}>BoxCric Technical Specification</h1>
                <p style={p}><strong>Version:</strong> 2.0 &nbsp;|&nbsp; <strong>Generated:</strong> {new Date().toLocaleDateString()}</p>
                <p style={p}>
                    This document provides an exhaustive technical breakdown of the BoxCric application architecture,
                    including all API endpoints, data flows, cascade triggers, algorithms, and file responsibilities.
                </p>

                {/* ========== SECTION 1 ========== */}
                <h2 style={h2}>1. System Overview</h2>
                <p style={p}>The application uses a <strong>Dual-Engine Polling Architecture</strong> to separate
                    global match awareness from focused live match data.</p>

                <pre style={pre}>{`
┌─────────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                              │
├────────────────────────┬────────────────────────────────────────┤
│   ENGINE A (Global)    │           ENGINE B (Active)            │
│   useCricketData.ts    │           App.tsx                      │
│   ADAPTIVE POLLING:    │           Poll: Every 10s              │
│   - 15s if live games  │           Scope: ONE Match             │
│   - 120s if no live    │                                        │
│   Scope: All Matches   │                                        │
└──────────┬─────────────┴─────────────┬──────────────────────────┘
           │                           │
           ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NETWORK LAYER                                │
│          Cloudflare Worker (CORS Proxy)                         │
│          cricket-proxy.boxboxcric.workers.dev                   │
└──────────┬─────────────┬─────────────┬──────────────────────────┘
           │             │             │
           ▼             ▼             ▼
┌──────────────────┐ ┌────────────────┐ ┌──────────────────────────┐
│  Wisden API      │ │ Wisden Static  │ │  Supabase                │
│  (Live Data)     │ │ (JSON Assets)  │ │  (Historical)            │
└──────────────────┘ └────────────────┘ └──────────────────────────┘
`}</pre>

                <h3 style={h3}>Adaptive Polling (Engine A)</h3>
                <pre style={pre}>{`
LOGIC: setTimeout + recursive scheduling (not setInterval)

const scheduleNextLivePoll = () => {
    const hasLiveMatches = bucketsRef.current.live.length > 0;
    const interval = hasLiveMatches ? 15000 : 60000;
    
    liveTimerId = setTimeout(() => {
        fetchLive();
        scheduleNextLivePoll();  // Re-evaluate interval
    }, interval);
};

WHY THIS WORKS:
- Interval is checked AFTER each fetch
- When a match goes live → bucket updates → next poll uses 15s
- When match ends → bucket empties → switches back to 60s

TRIGGERS:
- App launch: Initial fetch immediately
- Visibility change: Immediate fetch when tab returns to foreground
- PageShow (BFCache): Immediate fetch when restored from back/forward cache
`}</pre>

                {/* ========== SECTION 2 ========== */}
                <h2 style={h2}>2. Complete API Inventory</h2>
                <p style={p}>Every endpoint used by the application, with trigger conditions and consumers.</p>

                <table style={table}>
                    <thead>
                        <tr>
                            <th style={th}>Endpoint</th>
                            <th style={th}>Trigger</th>
                            <th style={th}>Consumer</th>
                            <th style={th}>Frequency</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={td}><code style={code}>/default.aspx?methodtype=3&gamestate=1</code></td>
                            <td style={td}>App Mount + Timer</td>
                            <td style={td}>useCricketData.ts → HomePage</td>
                            <td style={td}>Every 15s</td>
                        </tr>
                        <tr>
                            <td style={td}><code style={code}>/default.aspx?methodtype=3&gamestate=2</code></td>
                            <td style={td}>App Mount + Timer</td>
                            <td style={td}>useCricketData.ts → UpcomingListPage</td>
                            <td style={td}>Every 5min</td>
                        </tr>
                        <tr>
                            <td style={td}><code style={code}>/cricket/v1/game/scorecard?game_id=X</code></td>
                            <td style={td}>Match Click + Timer</td>
                            <td style={td}>App.tsx → LiveDetail</td>
                            <td style={td}>Every 10s (Live)</td>
                        </tr>
                        <tr>
                            <td style={td}><code style={code}>/functions/wallstream/?match_id=X</code></td>
                            <td style={td}>Match Click + Timer</td>
                            <td style={td}>App.tsx → LiveDetail → FloatingHeader</td>
                            <td style={td}>Every 10s (Live)</td>
                        </tr>
                        <tr>
                            <td style={td}><code style={code}>/cricket/v1/game/head-to-head?game_id=X</code></td>
                            <td style={td}>LiveDetail Mount</td>
                            <td style={td}>LiveDetail → LiveInsights, WinProbability (cached)</td>
                            <td style={td}>Once (cached in state)</td>
                        </tr>
                        <tr>
                            <td style={td}><code style={code}>/cricket/live/json/X_overbyover_N.json</code></td>
                            <td style={td}>Scorecard Update (Overs change)</td>
                            <td style={td}>LiveDetail → WormChart, ManhattanChart</td>
                            <td style={td}>On Ball Update</td>
                        </tr>
                        <tr>
                            <td style={td}><code style={code}>/cricket/live/json/X_batsman_splits_N.json</code></td>
                            <td style={td}>Scorecard Update (Overs change)</td>
                            <td style={td}>LiveDetail → WagonWheel, BatsmanBowlerMatchups</td>
                            <td style={td}>On Ball Update</td>
                        </tr>
                        <tr>
                            <td style={td}><code style={code}>Supabase: SELECT * FROM matches</code></td>
                            <td style={td}>LiveDetail Mount</td>
                            <td style={td}>matchDatabase.ts → DualTeamRecentForm</td>
                            <td style={td}>Once</td>
                        </tr>
                    </tbody>
                </table>

                {/* ========== SECTION 3 ========== */}
                <h2 style={h2}>3. Page → API Mapping</h2>

                <h3 style={h3}>HomePage.tsx</h3>
                <pre style={pre}>{`
DATA SOURCE: useCricketData.ts (imported as hook)
RECEIVES: matches[] (already merged from Live + Upcoming + Completed buckets)

INTERNAL LOGIC:
  - Calls sortByPriority(matches) from matchPriority.ts
  - Calls generateChips(matches) for filter chips
  - Calls filterByChip(matches, activeChip) when user selects a chip
  - Calls filterJustFinished(matches) for "Just Finished" section

TRIGGERS NAVIGATION:
  - onSelectMatch(match) → Opens LiveDetail
  - onOpenSeries(seriesId) → Opens SeriesHub
  - onOpenUpcomingList() → Opens UpcomingListPage
`}</pre>

                <h3 style={h3}>LiveDetail.tsx</h3>
                <pre style={pre}>{`
DATA SOURCE: Props from App.tsx (scorecard, wallstream)

DOES NOT POLL. Receives live data via props.

ON MOUNT (useEffect):
  1. fetchH2H(match.game_id) → setH2hData, setH2hPlayerData
     ↳ H2H is CACHED in state, reused for all probability calculations
  2. getTeamForm(teamId) from Supabase → For pre-match probability

ON SCORECARD UPDATE (useEffect dependency: currentOversStr):
  - Cascade Trigger!
  - fetchBatsmanSplits(gameId, innings) → setBatsmanSplits, setBatsmanSplitsMatchups
     ↳ Used by: WagonWheel, BatsmanBowlerMatchups
  - fetchOverByOver(gameId, innings) → setOverByOver, setManhattanData, setOverByOverMatchups
     ↳ Used by: WormChart, ManhattanChart, BatsmanBowlerMatchups (wickets)
  - Recalculates wormPrimary/wormSecondary

ON MANHATTAN INNINGS TOGGLE (useEffect dependency: manhattanInnings):
  - Fetches missing OBO data for newly selected innings

WIN PROBABILITY:
  - calculatePreMatchProbability() on mount (uses h2hPlayerData)
  - calculateLiveProbability() on every scorecard update
     ↳ REUSES cached h2hPlayerData (no refetch)

VISIBILITY REFRESH (App.tsx):
  - document.addEventListener('visibilitychange')
  - window.addEventListener('pageshow')
  - When page becomes visible again → loadDataRef.current() called
  - Immediately refetches scorecard + wallstream
`}</pre>


                <h3 style={h3}>UpcomingListPage.tsx</h3>
                <pre style={pre}>{`
DATA SOURCE: Props from App.tsx (matches[])

NO API CALLS. Pure derived state.

TIME CHIPS: Generated dynamically from current date
  - generateTimeChips() creates month/quarter chips

TYPE CHIPS: Generated from filtered matches
  - generateUpcomingChips(timeFilteredMatches)
  - Chips sorted by: Priority Tier → Earliest Date

FILTER CASCADE:
  1. User selects Time Chip → timeFilteredMatches computed
  2. typeChips regenerated from timeFilteredMatches
  3. User selects Type Chip → filteredMatches computed
  4. seriesGroups derived from filteredMatches
`}</pre>

                {/* ========== SECTION 4 ========== */}
                <h2 style={h2}>4. Data Flow Diagrams</h2>

                <h3 style={h3}>4.1 Home Page Load Sequence</h3>
                <pre style={pre}>{`
┌──────────────────┐    ┌─────────────────────┐    ┌───────────────┐
│     Browser      │    │   useCricketData    │    │   Wisden API  │
└────────┬─────────┘    └──────────┬──────────┘    └───────┬───────┘
         │                         │                       │
         │  1. App Mount           │                       │
         ├────────────────────────>│                       │
         │                         │  2. GET gamestate=1   │
         │                         ├──────────────────────>│
         │                         │  3. Live Matches[]    │
         │                         │<──────────────────────┤
         │                         │                       │
         │                         │  4. GET gamestate=2   │
         │                         ├──────────────────────>│
         │                         │  5. Upcoming[]        │
         │                         │<──────────────────────┤
         │                         │                       │
         │  6. setMatches(merged)  │                       │
         │<────────────────────────┤                       │
         │                         │                       │
         │  7. HomePage renders    │                       │
         │                         │                       │
`}</pre>

                <h3 style={h3}>4.2 Match Click → LiveDetail Cascade</h3>
                <pre style={pre}>{`
┌────────┐  ┌─────────┐  ┌────────────┐  ┌───────────────┐  ┌─────────┐
│HomePage│  │ App.tsx │  │ LiveDetail │  │   Wisden API  │  │Supabase │
└───┬────┘  └────┬────┘  └─────┬──────┘  └───────┬───────┘  └────┬────┘
    │            │             │                 │               │
    │ 1. Click   │             │                 │               │
    ├───────────>│             │                 │               │
    │            │             │                 │               │
    │ 2. Push MATCH to viewStack                 │               │
    │            │─────────────│                 │               │
    │            │             │                 │               │
    │ 3. Start 10s Timer       │                 │               │
    │            ├─────────────│                 │               │
    │            │             │                 │               │
    │ 4. fetchScorecard        │                 │               │
    │            ├─────────────────────────────->│               │
    │            │             │                 │               │
    │            │ 5. scorecard                  │               │
    │            │<─────────────────────────────-│               │
    │            │             │                 │               │
    │ 6. Pass props            │                 │               │
    │            ├────────────>│                 │               │
    │            │             │                 │               │
    │            │ 7. Mount: fetchH2H            │               │
    │            │             ├────────────────>│               │
    │            │             │                 │               │
    │            │ 8. Mount: getTeamForm         │               │
    │            │             ├─────────────────────────────────>
    │            │             │                 │               │
    │            │ 9. currentOversStr changes    │               │
    │            │             │ (CASCADE)       │               │
    │            │             ├────────────────>│ fetchOBO      │
    │            │             ├────────────────>│ fetchSplits   │
    │            │             │                 │               │
`}</pre>

                <h3 style={h3}>4.3 Background Pause/Resume</h3>
                <pre style={pre}>{`
SCENARIO: User clicks "View Series" while watching a live match

┌─────────┐  ┌─────────┐  ┌────────────┐  ┌───────────┐
│LiveDetail│  │ App.tsx │  │ SeriesHub  │  │ Wisden API│
└────┬─────┘  └────┬────┘  └─────┬──────┘  └─────┬─────┘
     │             │             │               │
     │ 1. Click    │             │               │
     ├────────────>│             │               │
     │             │             │               │
     │ 2. Push SERIES to viewStack               │
     │             ├────────────>│               │
     │             │             │               │
     │ 3. currentView.type !== 'MATCH'           │
     │             ├─────X       │               │
     │             │ STOP TIMER  │               │
     │             │             │               │
     │ 4. LiveDetail still mounted but receives NO new props
     │             │             │               │
     │ 5. User clicks Back       │               │
     │             │<────────────┤               │
     │             │             │               │
     │ 6. Pop viewStack          │               │
     │             ├─────────────│               │
     │             │             │               │
     │ 7. currentView.type === 'MATCH'           │
     │             │ RESTART TIMER               │
     │             ├─────────────────────────────>
     │             │             │               │
`}</pre>

                {/* ========== SECTION 5 ========== */}
                <h2 style={h2}>5. Priority Algorithm (Bucket Merge)</h2>
                <p style={p}>Located in <code style={code}>useCricketData.ts</code>. The <code style={code}>recomputeMatches()</code>
                    function merges three buckets into a single array.</p>

                <pre style={pre}>{`
BUCKET STRUCTURE:
  bucketsRef = {
    live: Match[],          // Overwritten every 15s
    upcoming: Match[],      // Overwritten every 5min
    completed: Map<game_id, Match>  // Merged/Appended
  }

MERGE LOGIC (Priority Order):
  1. Start with Completed (lowest priority)
  2. Add Upcoming (overwrites Completed if collision)
  3. Add Live (overwrites everything - Source of Truth)

RESULT: Single matches[] array with no duplicates.

WHY THIS MATTERS:
  - Prevents "ghost" matches (old data persisting)
  - Ensures Live data is always freshest
  - Completed uses Map for efficient pagination merging
`}</pre>

                <h3 style={h3}>Match Priority Scoring</h3>
                <p style={p}>Located in <code style={code}>matchPriority.ts</code>. Used for sorting and chip generation.</p>

                <table style={table}>
                    <thead>
                        <tr>
                            <th style={th}>Category</th>
                            <th style={th}>Priority</th>
                            <th style={th}>Examples</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td style={td}>ICC World Cups</td><td style={td}>1</td><td style={td}>T20 WC, ODI WC, Champions Trophy</td></tr>
                        <tr><td style={td}>Top 10 Int'l Bilaterals</td><td style={td}>2</td><td style={td}>IND vs AUS, ENG vs NZ</td></tr>
                        <tr><td style={td}>Asia Cup</td><td style={td}>3</td><td style={td}>Asia Cup T20</td></tr>
                        <tr><td style={td}>IPL</td><td style={td}>4</td><td style={td}>IPL 2025</td></tr>
                        <tr><td style={td}>WPL</td><td style={td}>5</td><td style={td}>WPL 2025</td></tr>
                        <tr><td style={td}>BBL</td><td style={td}>6</td><td style={td}>BBL 2025</td></tr>
                        <tr><td style={td}>Other Premium</td><td style={td}>7-14</td><td style={td}>The Hundred, SA20, PSL</td></tr>
                        <tr><td style={td}>Top Women's</td><td style={td}>15</td><td style={td}>India W vs Australia W</td></tr>
                        <tr><td style={td}>Other Int'l</td><td style={td}>20+</td><td style={td}>Lower-ranked teams</td></tr>
                        <tr><td style={td}>Domestic</td><td style={td}>100</td><td style={td}>Ranji Trophy, County</td></tr>
                    </tbody>
                </table>

                {/* ========== SECTION 6 ========== */}
                <h2 style={h2}>6. Win Probability Model</h2>
                <p style={p}>Located in <code style={code}>winProbability.ts</code>. Calculates probability based on match phase.</p>

                <h3 style={h3}>6.1 Pre-Match (Before Ball 1)</h3>
                <pre style={pre}>{`
FACTORS (International):
  - ICC Ranking: 20%
  - H2H Record: 20%
  - Recent Form (Last 5): 15%
  - Venue Stats: 10%
  - Pitch Type: 15%
  - Home Advantage: 10%

FACTORS (Franchise):
  - H2H Record: 25%
  - Recent Form: 25%
  - Venue Stats: 15%
  - Pitch Type: 15%
  - Home Advantage: 10%
  - Pedigree: 10%

OUTPUT: WinProbabilityResult { team1: {name, probability}, team2: {...} }
`}</pre>

                <h3 style={h3}>6.2 Live - 1st Innings</h3>
                <pre style={pre}>{`
MODEL: Projected Score vs Dynamic Par

CALCULATION:
  ResourceFactor = 1 - (Wickets × 0.08 to 0.12)
  Projected = Runs + (CRR × OversLeft × ResourceFactor)
  
  DynamicPar = BasePar + PitchAdj + StrengthDiff
    - BasePar: T20=165, ODI=270
    - PitchAdj: Batting=+15, Bowling=-15
    - StrengthDiff: (BattingTeam - BowlingTeam) / 5

  Delta = Projected - DynamicPar
  LiveProb = 50 + (Delta × 0.5)

ADJUSTMENTS:
  - Partnership Momentum: +5 to +15% for big stands
  - OBO Momentum: +/-10% based on last 3 overs vs match rate
`}</pre>

                <h3 style={h3}>6.3 Live - 2nd Innings (Chase)</h3>
                <pre style={pre}>{`
MODEL: RRR Pressure Matrix

RRR THRESHOLDS (T20):
  RRR > 13: 5% Win Prob (Near Impossible)
  RRR > 12: 10% Win Prob
  RRR > 10: 20% Win Prob
  RRR > 9: 35% Win Prob
  RRR > 8: 45% Win Prob
  RRR < 6: 80% Win Prob

WICKET PENALTY:
  < 3 wickets left: Multiply by 0.2
  < 5 wickets left: Multiply by 0.5
  < 7 wickets left: Multiply by 0.8

DEATH OVERS (< 5 overs left):
  Runs/Ball > 2.5: Multiply by 0.1
  Runs/Ball > 2.0: Multiply by 0.2
  Runs/Ball > 1.5: Multiply by 0.4
  Runs/Ball < 0.5: Multiply by 1.3 (Cruise)
`}</pre>

                {/* ========== SECTION 7 ========== */}
                <h2 style={h2}>7. Dynamic Filter Logic</h2>

                <h3 style={h3}>Time Chips (UpcomingListPage)</h3>
                <pre style={pre}>{`
GENERATION: generateTimeChips()
  1. Start from current month
  2. Add 4 individual months
  3. Add quarterly groups until December
  4. Add next year

EXAMPLE (if today is January 2026):
  [Jan] [Feb] [Mar] [Apr] [May-Jul] [Aug-Oct] [Nov-Dec] [2027]
`}</pre>

                <h3 style={h3}>Type Chips (Dynamic)</h3>
                <pre style={pre}>{`
GENERATION: generateUpcomingChips(matches)
  1. For each match, extract chipId via getMatchChip(match)
  2. Track earliest date and priority tier for each chip
  3. Sort chips by: Priority Tier → Earliest Date

FILTER CASCADE:
  timeFilteredMatches = filter by selected time chip
  typeChips = generateUpcomingChips(timeFilteredMatches)  ← Regenerated!
  filteredMatches = filterByChip(timeFilteredMatches, selectedTypeChip)
`}</pre>

                {/* ========== SECTION 8 ========== */}
                <h2 style={h2}>8. Deep Parameter Tracing</h2>

                <h3 style={h3}>8.1 Scorecard Object Journey</h3>
                <pre style={pre}>{`
[ORIGIN]        App.tsx → fetchScorecard(gameId) via useCricketData
                ↓
[TRANSFORM 1]   useCricketData.ts → sanitizeScorecard()
                - Renames "Royal Challengers Bangalore" → "Royal Challengers"
                ↓
[STORE]         App.tsx → setScorecard(sc)
                ↓
[CONSUMER 1]    LiveDetail.tsx receives via props
                - Extracts: Innings[], Teams{}, Matchdetail{}
                ↓
[CONSUMER 2]    LiveDetail → Passes to LiveInsights
                - Used for: WormChart, ManhattanChart, Partnerships
                ↓
[CONSUMER 3]    winProbability.ts → calculateLiveProbability(scorecard)
                - Reads: Innings[].Total, Overs, Wickets, Target
                ↓
[CONSUMER 4]    FloatingHeader gets derived data via setHeaderData()
                - Computes: score, overs, batsman name from wallstream
`}</pre>

                <h3 style={h3}>8.2 matches[] Array Journey</h3>
                <pre style={pre}>{`
[ORIGIN]        useCricketData.ts → fetchLive(), fetchHeavy()
                ↓
[TRANSFORM 1]   sanitizeMatch() called on each match
                ↓
[STORE]         bucketsRef.current.live/upcoming/completed
                ↓
[MERGE]         recomputeMatches() → setMatches(merged)
                ↓
[CONSUMER 1]    App.tsx → passes to HomePage
                ↓
[CONSUMER 2]    HomePage → sortByPriority(matches)
                → filterJustFinished(matches) for "Just Finished"
                → generateChips(matches) for filter UI
                ↓
[CONSUMER 3]    UpcomingListPage → receives matches prop
                → Filters by time/type chips
                → Groups by series
`}</pre>

                {/* ========== SECTION 9 ========== */}
                <h2 style={h2}>9. File Role Matrix</h2>

                <table style={table}>
                    <thead>
                        <tr>
                            <th style={th}>File</th>
                            <th style={th}>Layer</th>
                            <th style={th}>Responsibility</th>
                            <th style={th}>Inputs</th>
                            <th style={th}>Outputs</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={td}><strong>api.ts</strong></td>
                            <td style={td}>Util</td>
                            <td style={td}>CORS Proxy config, base URLs</td>
                            <td style={td}>None</td>
                            <td style={td}>proxyFetch(), WISDEN_* constants</td>
                        </tr>
                        <tr>
                            <td style={td}><strong>useCricketData.ts</strong></td>
                            <td style={td}>Hook</td>
                            <td style={td}>Global polling, bucket merge, all fetch functions</td>
                            <td style={td}>None (self-polls)</td>
                            <td style={td}>matches[], fetchScorecard, fetchH2H, fetchOBO</td>
                        </tr>
                        <tr>
                            <td style={td}><strong>App.tsx</strong></td>
                            <td style={td}>Main</td>
                            <td style={td}>View stack, Active Match Timer, Route handling</td>
                            <td style={td}>useCricketData output</td>
                            <td style={td}>scorecard, wallstream to views</td>
                        </tr>
                        <tr>
                            <td style={td}><strong>HomePage.tsx</strong></td>
                            <td style={td}>View</td>
                            <td style={td}>Match list display, filter chips, navigation triggers</td>
                            <td style={td}>matches[], callbacks</td>
                            <td style={td}>Renders MatchCard, UpcomingCard</td>
                        </tr>
                        <tr>
                            <td style={td}><strong>LiveDetail.tsx</strong></td>
                            <td style={td}>View</td>
                            <td style={td}>Match detail renderer, H2H/Chart fetching on mount</td>
                            <td style={td}>scorecard, wallstream, match</td>
                            <td style={td}>Renders LiveInsights, Charts, WinProb</td>
                        </tr>
                        <tr>
                            <td style={td}><strong>LiveInsights.tsx</strong></td>
                            <td style={td}>View</td>
                            <td style={td}>Chart container, displays WormChart, Manhattan, WagonWheel</td>
                            <td style={td}>All chart data props</td>
                            <td style={td}>Renders chart components</td>
                        </tr>
                        <tr>
                            <td style={td}><strong>BatsmanBowlerMatchups.tsx</strong></td>
                            <td style={td}>View</td>
                            <td style={td}>Per-matchup win/loss verdict for batsman vs bowler</td>
                            <td style={td}>batsmanSplits, overByOver</td>
                            <td style={td}>Renders matchup cards with verdict badges</td>
                        </tr>
                        <tr>
                            <td style={td}><strong>matchPriority.ts</strong></td>
                            <td style={td}>Util</td>
                            <td style={td}>Priority scoring, chip generation, filtering</td>
                            <td style={td}>Match[]</td>
                            <td style={td}>Sorted matches, Chip[], filtered matches</td>
                        </tr>
                        <tr>
                            <td style={td}><strong>winProbability.ts</strong></td>
                            <td style={td}>Util</td>
                            <td style={td}>Pre-match + Live probability calculation</td>
                            <td style={td}>Scorecard, H2H, Form</td>
                            <td style={td}>WinProbabilityResult</td>
                        </tr>
                        <tr>
                            <td style={td}><strong>matchDatabase.ts</strong></td>
                            <td style={td}>Util</td>
                            <td style={td}>Supabase queries for historical data</td>
                            <td style={td}>Team IDs</td>
                            <td style={td}>Form array, H2H history</td>
                        </tr>
                        <tr>
                            <td style={td}><strong>FloatingHeader.tsx</strong></td>
                            <td style={td}>View</td>
                            <td style={td}>Global header with back button and live score ticker</td>
                            <td style={td}>headerData from App</td>
                            <td style={td}>Renders score, ball info, LIVE pill</td>
                        </tr>
                    </tbody>
                </table>


            </div>
        </div>
    );
};

export default HowItWorks;
