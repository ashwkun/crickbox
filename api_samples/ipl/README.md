# IPL (Indian Premier League) API Documentation

This directory contains sample responses from Wisden Cricket APIs specifically for IPL 2025 data.

## IPL 2025 Identifiers

| Identifier | Value | Purpose |
|:-----------|:------|:--------|
| **Series ID** | `8307` | IPL 2025 series identifier |
| **Tour ID** | `7126` | IPL 2025 tour identifier |
| **Parent ID** | `14` | Indian Premier League (all seasons) |
| **Comp Type ID** | `6` | T20 Domestic (Men) - used for IPL |
| **League ID** | `2` | IPL league identifier |
| **Client ID** | `430fdd0d` | Same as other Cricket v1 APIs |

---

## IPL 2025 Details

- **Series Name:** Indian Premier League, 2025
- **Start Date:** March 22, 2025
- **End Date:** June 3, 2025
- **Total Matches:** 74
- **Participants:** 10 teams
- **Winner:** Royal Challengers Bengaluru (RCB)
- **Coverage Level:** Live Scorecard, Ball-by-Ball and Commentary

---

## IPL Franchise Team IDs

| Team Name | Team ID | Short Name |
|:----------|:--------|:-----------|
| Royal Challengers Bengaluru | `1105` | RCB |
| Mumbai Indians | `1111` | MI |
| Gujarat Titans | `2955` | GT |
| Punjab Kings | `1107` | PBKS |
| Delhi Capitals | `1109` | DC |
| Sunrisers Hyderabad | `1379` | SRH |
| Lucknow Super Giants | `2954` | LSG |
| Kolkata Knight Riders | `1106` | KKR |
| Rajasthan Royals | `1110` | RR |
| Chennai Super Kings | `1108` | CSK |

---

## Working IPL APIs ✅

### 1. IPL Series Information
**Endpoint:** `/cricket/v1/series`

**Purpose:** Get comprehensive IPL season information including dates, participating teams, and results.

**Parameters:**
- `series_id`: `8307` (for IPL 2025)
- `client_id`: `430fdd0d`
- `feed_format`: `json`
- `lang`: `en`

**Example:**
```bash
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Fseries%3Fseries_id%3D8307%26client_id%3D430fdd0d%26feed_format%3Djson%26lang%3Den"
```

**Sample:** `ipl_series_info.json` (2.7KB)

**Key Data:**
- Series name, dates, status
- Parent championship (IPL overall)
- All participating teams with match counts
- Win/loss records for each team
- Series winner
- Coverage level
- Whether squads are available

---

### 2. IPL Teams
**Endpoint:** `/cricket/v1/team`

**Purpose:** Get list of all IPL teams with their details and recent matches.

**Parameters:**
- `series_id`: `8307`
- `client_id`: `430fdd0d`
- `feed_format`: `json`
- `lang`: `en`

**Example:**
```bash
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Fteam%3Fseries_id%3D8307%26client_id%3D430fdd0d%26feed_format%3Djson%26lang%3Den"
```

**Sample:** `ipl_teams.json` (24KB)

**Key Data:**
- Team ID, name, short name
- Gender, nationality
- ICC rankings (if applicable)
- Best performance in IPL history
- List of matches for each team in the series:
  - Match details (teams, venue, date/time)
  - Series information
  - Tournament stage

---

### 3. IPL Match Scorecard
**Endpoint:** `/cricket/v1/game/scorecard`

**Purpose:** Get detailed scorecard for any IPL match.

**Parameters:**
- `game_id`: Match identifier (e.g., `253698` for Match 1)
- `client_id`: `430fdd0d`
- `feed_format`: `json`
- `lang`: `en`

**Example:**
```bash
# IPL 2025 Match 1
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Fgame%2Fscorecard%3Fgame_id%3D253698%26client_id%3D430fdd0d%26feed_format%3Djson%26lang%3Den"
```

**Sample:** `ipl_match_scorecard.json` (65KB)

**Key Data:**
- Full batting and bowling scorecards
- Innings details
- Fall of wickets
- Partnerships
- Player stats
- Match result

---

### 4. IPL Schedule/Fixtures
**Endpoint:** `/cricket/v1/schedule`

**Purpose:** Get all IPL matches for the season.

**Parameters:**
- `series_id`: `8307`
- `client_id`: `430fdd0d`
- `feed_format`: `json`

**Example:**
```bash
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Fschedule%3Fseries_id%3D8307%26client_id%3D430fdd0d%26feed_format%3Djson"
```

**Sample:** `ipl_schedule.json` (88KB)

> **Note:** The current sample shows incorrect data (Australian Women's cricket). The API may require additional parameters or the series has conflicting data.

---

## Non-Working IPL APIs ❌

### 5. IPL Standings/Points Table
**Endpoints Tested:**
- `/cricket/v1/standings?series_id=8307...`
- `/cricket/v1/series/standings?series_id=8307...`

**Status:** Returns empty/404

**Workaround:** Use the Series Information API (`/cricket/v1/series`) which includes team match counts and win/loss records in the `teams` array.

**Alternative:** Calculate points from match results (2 points per win).

---

### 6. IPL Player Statistics
**Endpoint:** `/cricket/v1/stats/player_level_stats`

**Tested Parameters:**
- `comp_type_id=6` (IPL competition type)
- `stat_id=1` (Most Runs)
- `stat_id=2` (Orange Cap)
- `stat_id=12` (Most Wickets)
- `stat_id=13` (Purple Cap)

**Status:** Returns error: "The requested resource does not exist in the database."

**Note:** The stats API may require:
- Different parameters (e.g., `parent_id`, `series_id`, `championship_id`)
- May only work for current/ongoing tournaments
- IPL 2025 is marked as completed, stats might not be accessible via this endpoint

**Samples:** 
- `ipl_orange_cap.json` (244B - error response)
- `ipl_purple_cap.json` (244B - error response)
- `ipl_most_runs.json` (244B - error response)
- `ipl_most_wickets.json` (244B - error response)

---

## How to Get IPL Data

### Get All IPL Seasons
```bash
# Search for series with parent_id=14 (IPL)
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Fseries%3Fparent_id%3D14%26client_id%3D430fdd0d%26feed_format%3Djson%26lang%3Den"
```

### Get Team Squad for IPL Franchise
```bash
# Use team_id from the table above
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Fteam%3Fteam_id%3D1105%26client_id%3D430fdd0d%26feed_format%3Djson%26lang%3Den"
```

### Get Team's Recent Form
```bash
# Use team schedule API
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Fschedule%3Fis_recent%3Dtrue%26team_id%3D1105%26page_size%3D5%26client_id%3D430fdd0d%26feed_format%3Djson%26lang%3Den"
```

---

## Implementation Notes

### Points Table Calculation
Since the standings API doesn't work, calculate points from the Series Information API:
```typescript
const seriesData = await fetch(series_api);
const standings = seriesData.data[0].teams
  .map(team => ({
    name: team.name,
    matches: team.matches,
    wins: team.wins,
    losses: team.loss,
    points: team.wins * 2, // 2 points per win
    nrr: 0 // NRR not available, would need match-by-match data
  }))
  .sort((a, b) => b.points - a.points || b.wins - a.wins);
```

### Finding Match IDs
- Match IDs are included in the team response under `matches` array
- Each match has a `match_id` field
- Example: Match 1 has `match_id: "253698"`

### IPL-Specific Filters
When using generic APIs, filter for IPL using:
- `comp_type_id=6` (T20 Domestic Men)
- `league_id=2` (IPL)
- `parent_id=14` (Indian Premier League)
- `series_id=8307` (IPL 2025 specifically)

---

## Summary Table

| API | Endpoint | Status | Sample Size | Notes |
|:----|:---------|:-------|:------------|:------|
| Series Info | `/cricket/v1/series` | ✅ Working | 2.7KB | Best source for team standings |
| Teams | `/cricket/v1/team` | ✅ Working | 24KB | Includes match list per team |
| Scorecard | `/cricket/v1/game/scorecard` | ✅ Working | 65KB | Same as general match scorecard |
| Schedule | `/cricket/v1/schedule` | ⚠️ Issues | 88KB | Returns wrong data, needs investigation |
| Standings | `/cricket/v1/standings` | ❌ Empty | 0B | Use series info instead |
| Player Stats | `/cricket/v1/stats/player_level_stats` | ❌ Error | 244B | Not available for IPL 2025 |

---

## Key Findings

1. **No Dedicated Standings API:** Points table must be calculated from team win/loss records
2. **No Player Stats API:** Orange Cap/Purple Cap data not available via API
3. **Series Info is Gold:** The `/cricket/v1/series` endpoint provides the most comprehensive IPL data including all teams and their records
4. **Team IDs are Consistent:** Franchise team IDs remain the same across IPL seasons
5. **Schedule API Issues:** May need additional investigation or different parameters

---

## Recommendations

1. **Use Series API for Standings:** Calculate points table from team records in series info
2. **Scrape Orange/Purple Cap:** Player statistics APIs don't work; may need web scraping
3. **Use Team Schedule for Form:** Get recent matches via team schedule API
4. **Match-by-Match for NRR:** To calculate Net Run Rate, fetch individual scorecards
5. **Monitor for API Updates:** Stats endpoints may become available for live tournaments

---

## Files in This Directory

- `ipl_series_info.json` (2.7KB) - ✅ Complete IPL 2025 series data
- `ipl_teams.json` (24KB) - ✅ All 10 IPL franchises with match lists
- `ipl_match_scorecard.json` (65KB) - ✅ Sample match scorecard
- `ipl_schedule.json` (88KB) - ⚠️ Contains incorrect data
- `ipl_standings.json` (0B) - ❌ Empty response
- `ipl_orange_cap.json` (244B) - ❌ Error response
- `ipl_purple_cap.json` (244B) - ❌ Error response
- `ipl_most_runs.json` (244B) - ❌ Error response
- `ipl_most_wickets.json` (244B) - ❌ Error response
