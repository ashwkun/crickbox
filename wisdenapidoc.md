# Wallstream & Wisden API Documentation



## 1. Overview
This application powers its live cricket data using a combination of **Wisden APIs** (for matches, scorecards, and historical data) and **Wallstream** (for real-time ball-by-ball commentary).

All requests are routed through a custom **CORS Proxy** to bypass browser restrictions and manage caching.

---

## 2. CORS Proxy Architecture

Direct calls to Wisden APIs from a browser will fail due to CORS. We use a Cloudflare Worker as a proxy.

- **Proxy URL**: `https://cricket-proxy.boxboxcric.workers.dev/?url=`
- **Logic**: Appends the target encoded URL as a query parameter.
- **Source Code**: `src/utils/api.ts`

**Example:**
```typescript
const target = "https://www.wisden.com/default.aspx?...";
const finalUrl = `${CORS_PROXY}${encodeURIComponent(target)}`;
```

---

## 3. API Endpoints

### A. Matches List (Live & Upcoming)
Fetches the main list of matches. Used for the Home Screen and finding valid `game_id`s.

| Feature | Details |
| :--- | :--- |
| **Method** | `GET` |
| **Initiation Point** | `src/utils/useCricketData.ts` (Lines 67, 85) |
| **Poll Interval** | 15s (Live), 5m (Schedule) |
| **Sample Data** | [live_matches.json](api_samples/live_matches.json) |

**URL Structure:**
```text
https://www.wisden.com/default.aspx?methodtype=3&client={CLIENT_MATCHES}&sport=1&league=0&timezone=0530&language=en&gamestate={STATE}
```
- `gamestate=1`: Live Matches
- `gamestate=2`: Upcoming Matches
- `gamestate=4`: Recent Completed Matches (Last few days)
- `gamestate=3`: Archived Matches (Older, e.g., 2023 - *Avoid*)

---

### B. Results (Historical Data)
Fetches past match results using a date range filter.

| Feature | Details |
| :--- | :--- |
| **Method** | `GET` |
| **Initiation Point** | `src/utils/useCricketData.ts` (Lines 86, 184) |
| **Updates** | On Load / 5 minutes |
| **Sample Data** | [results_dec_2025.json](api_samples/results_dec_2025.json) |

**URL Structure:**
```text
https://www.wisden.com/default.aspx?methodtype=3&client={CLIENT_MATCHES}&sport=1&league=0&timezone=0530&language=en&daterange={START}-{END}
```
- `daterange`: `DDMMYYYY-DDMMYYYY` (e.g., `01122025-31122025`)
- **Limit**: Max range of **30 days** per request.
- **Chaining**: To fetch more than 30 days, make multiple requests (e.g., Dec 1-30, Nov 1-30) and merge arrays.

---

### C. Scorecard (Match Details)
Provides detailed innings data, player stats, fall of wickets, and partnerships.

| Feature | Details |
| :--- | :--- |
| **Method** | `GET` |
| **Initiation Point** | `src/App.tsx` (Line 125) |
| **Poll Interval** | 15s (Synced with Wallstream for Live games) |
| **Sample Data** | [scorecard.json](api_samples/scorecard.json) |

**URL Structure:**
```text
https://www.wisden.com/cricket/v1/game/scorecard?lang=en&feed_format=json&client_id={CLIENT_SCORECARD}&game_id={GAME_ID}
```

---

### D. Wallstream (Ball-by-Ball)
The "Heartbeat" of the Live Detail view. Provides real-time commentary, ball speed, and detailed event metadata.

| Feature | Details |
| :--- | :--- |
| **Method** | `GET` |
| **Initiation Point** | `src/App.tsx` (Line 133) -> `src/utils/wallstreamApi.ts` |
| **Poll Interval** | 15s (Live) |
| **Sample Data** | [wallstream.json](api_samples/wallstream.json) |

**URL Structure:**
```text
https://www.wisden.com/functions/wallstream/?sport_id=1&client_id={WALLSTREAM_CLIENT}&match_id={MATCH_ID}&page_size=10&page_no=1&session={INNINGS}
```
> **Note**: `match_id` is the **last 6 digits** of the alphanumeric `game_id`.
> Example: `game_id="afupku12272025268833"` -> `match_id="268833"`

---

### E. Head-to-Head (H2H) & Stats
Fetches historical data, recent form, and venue statistics for the "Analysis" tab.

| Feature | Details |
| :--- | :--- |
| **Method** | `GET` |
| **Initiation Point** | `src/components/MatchDetail.tsx` (via `useH2HData` hook) |
| **Sample Data** | [h2h_full.json](api_samples/h2h_full.json) |

**URL Structure:**
```text
https://www.wisden.com/cricket/v1/game/head-to-head?client_id={CLIENT_SCORECARD}&feed_format=json&game_id={GAME_ID}&lang=en
```

---

## 4. Client Identifiers & Config

**Source of Truth:** `src/utils/wisdenConfig.ts`

This file contains the hardcoded Client IDs required for API access. If APIs stop working, these likely rotated.

| Key | Value (Current) | Purpose |
| :--- | :--- | :--- |
| `CLIENT_MATCHES` | `e656463796` | Matches List & Results API |
| `CLIENT_SCORECARD` | `430fdd0d` | Scorecard & H2H APIs |
| `WALLSTREAM_CLIENT` | `lx/QMpdauKZQKYaddAs76w==` | Wallstream Auth (URL Encode this!) |

> [!TIP]
> **How to find new keys:**
> 1. Visit wisden.com live scores page.
> 2. Open Network Tab.
> 3. Filter for `client_id` or `client=` in requests.
> 4. Update `src/utils/wisdenConfig.ts` with new values.

---

## 5. Testing & Verification

Information to verify API health.

**Curl Command Template:**
```bash
# Test Live Matches
curl -s "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fdefault.aspx%3Fmethodtype%3D3%26client%3De656463796%26sport%3D1%26league%3D0%26timezone%3D0530%26language%3Den%26gamestate%3D1"

# Test Wallstream (Replace MATCH_ID)
# Note: Client ID must be double encoded if testing via curl against proxy manually
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Ffunctions%2Fwallstream%2F%3Fsport_id%3D1%26client_id%3Dlx%2FQMpdauKZQKYaddAs76w%3D%3D%26match_id%3D268833%26page_size%3D10%26page_no%3D1%26session%3D1"
```

> [!TIP]
> Always check `game_id` from the **Matches List** first. It changes for every match. Do not hardcode `game_id` in production.
