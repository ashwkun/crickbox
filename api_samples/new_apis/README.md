# New Wisden APIs Discovery

This directory contains sample responses from newly discovered Wisden Cricket APIs that were not previously documented in `wisdenapidoc.md`.

## Discovery Context

These APIs were discovered while investigating how Wisden displays the **Form Guide** (recent team form) on their match pages. All APIs use the same CORS proxy and client credentials as the existing documented APIs.

---

## Working APIs ✅

### 1. Team Profile

**Endpoint:** `/cricket/v1/team`

**Purpose:** Get detailed team information including coach, social media, trophy cabinet, and team writeup.

**Parameters:**

- `team_id`: Team identifier (e.g., `1126` for India Women)
- `lang`: `en`
- `feed_format`: `json`
- `client_id`: `430fdd0d`

**Example:**

```bash
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Fteam%3Fteam_id%3D1126%26lang%3Den%26feed_format%3Djson%26client_id%3D430fdd0d"
```

**Sample:** `team_profile.json` (313KB)

**Key Data:**

- Team names (full, short, display)
- Gender, nationality, home venue
- Coach/staff details
- Social media links
- Trophy cabinet/achievements
- Team writeup/history

---

### 2. Team Schedule

**Endpoint:** `/cricket/v1/schedule`

**Purpose:** Get recent or upcoming matches for a specific team.

**Parameters:**

- `team_id`: Team identifier
- `is_recent`: `true` (for recent matches) or `false` (for upcoming)
- `page_size`: Number of matches (e.g., `10`)
- `lang`: `en`
- `feed_format`: `json`
- `client_id`: `430fdd0d`

**Example:**

```bash
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Fschedule%3Fis_recent%3Dtrue%26team_id%3D1126%26page_size%3D10%26lang%3Den%26feed_format%3Djson%26client_id%3D430fdd0d"
```

**Sample:** `team_schedule.json` (41KB)

**Key Data:**

- Match details (teams, venue, date/time)
- Match status and result
- Series information
- Whether teams have squads available
- Coverage level

**Note:** This can be used as a fallback to calculate team form if the `/team/form` API is unavailable.

---

### 3. Rankings

**Endpoint:** `/cricket/v1/ranking`

**Purpose:** Get ICC rankings for teams or players by format and type.

**Parameters:**

- `comp_type`: Competition type
  - `1` = Test
  - `2` = ODI
  - `3` = T20I
- `gender`:
  - `1` = Men
  - `2` = Women
- `type`: Ranking type
  - `1` = Team
  - `2` = Batting
  - `3` = Bowling
  - `4` = All-rounder
- `lang`: `en`
- `feed_format`: `json`
- `client_id`: `430fdd0d`

**Examples:**

```bash
# Men's T20I Team Rankings
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Franking%3Fcomp_type%3D3%26gender%3D1%26type%3D1%26lang%3Den%26feed_format%3Djson%26client_id%3D430fdd0d"

# Men's T20I Batting Rankings
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Franking%3Fcomp_type%3D3%26gender%3D1%26type%3D2%26lang%3Den%26feed_format%3Djson%26client_id%3D430fdd0d"
```

**Samples:**

- `rankings_test.json` (47KB) - Men's Test team rankings
- `rankings_odi.json` (48KB) - Men's ODI team rankings
- `rankings_t20i.json` (47KB) - Men's T20I team rankings
- `rankings_wt20i.json` (48KB) - Women's T20I team rankings
- `rankings_t20i_batting.json` (48KB) - Men's T20I batting rankings
- `rankings_t20i_bowling.json` (47KB) - Men's T20I bowling rankings
- `rankings_t20i_allrounder.json` (37KB) - Men's T20I all-rounder rankings

**Key Data:**

- Current ranking position
- Points
- Career best ranking
- Player/team details
- Rank change indicator

---

### 4. Player Profile

**Endpoint:** `/cricket/v1/player`

**Purpose:** Get comprehensive player information including biography, stats, and social media.

**Parameters:**

- `player_id`: Player identifier (e.g., `66799` for Abhishek Sharma)
- `lang`: `en`
- `feed_format`: `json`
- `client_id`: `430fdd0d`

**Example:**

```bash
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Fplayer%3Fplayer_id%3D66799%26lang%3Den%26feed_format%3Djson%26client_id%3D430fdd0d"
```

**Sample:** `player_profile.json` (412KB)

**Key Data:**

- Full name, DOB, nationality
- Playing role, batting/bowling style
- Detailed biography/writeup
- Social media links
- Career statistics across formats
- Records and achievements

---

### 5. Venue

**Endpoint:** `/cricket/v1/venue`

**Purpose:** Get detailed venue information including history, statistics, and records.

**Parameters:**

- `venue_id`: Venue identifier (e.g., `89` for Lord's)
- `lang`: `en`
- `feed_format`: `json`
- `client_id`: `430fdd0d`

**Example:**

```bash
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Fvenue%3Fvenue_id%3D89%26lang%3Den%26feed_format%3Djson%26client_id%3D430fdd0d"
```

**Sample:** `venue.json` (316KB)

**Key Data:**

- Venue name, city, country
- Capacity, floodlights, established date
- Venue ends
- Coordinates (lat/long)
- Detailed history/writeup
- Format-wise statistics (Tests, ODIs, T20Is):
  - Average scores per innings
  - Highest/lowest totals
  - Win percentages
  - Most successful teams/players
  - Records

---

### 6. Series

**Endpoint:** `/cricket/v1/series`

**Purpose:** Get series information including participating teams and results.

**Parameters:**

- `series_id`: Series identifier
- `lang`: `en`
- `feed_format`: `json`
- `client_id`: `430fdd0d`

**Example:**

```bash
curl "https://cricket-proxy.boxboxcric.workers.dev/?url=https%3A%2F%2Fwww.wisden.com%2Fcricket%2Fv1%2Fseries%3Fseries_id%3D13452%26lang%3Den%26feed_format%3Djson%26client_id%3D430fdd0d"
```

**Sample:** `series.json` (2.1KB)

**Key Data:**

- Series name, dates
- Competition type (Test/ODI/T20I)
- Tour information
- Participating teams with stats (wins/losses/draws)
- Series result
- Whether teams have squads
- Coverage level

---

## Non-Working / Empty Response APIs ❌

### 7. Team Form ⚠️

**Endpoint:** `/cricket/v1/team/form`

**Status:** Returns empty/404 response

**Parameters:**

- `team_id`: Team identifier
- `lang`: `en`
- `feed_format`: `json`
- `client_id`: `430fdd0d`

**Note:** This appears to be the intended endpoint for team form guide data (W/L/D indicators), but currently returns no data. The form guide is likely calculated from recent matches via the `/schedule` API instead.

**Sample:** `team_form.json` (0 bytes)

---

### 8. Squad

**Endpoint:** `/cricket/v1/game/squad`

**Status:** Returns empty response for tested match

**Sample:** `squad.json` (0 bytes)

---

### 9. Match Details

**Endpoint:** `/cricket/v1/game/match-details`

**Status:** Returns empty response for tested match

**Sample:** `match_details.json` (0 bytes)

---

### 10. Series Standings

**Endpoint:** `/cricket/v1/series/standings`

**Status:** Returns empty response for tested series

**Sample:** `series_standings.json` (0 bytes)

---

## Key Findings

### Form Guide Implementation

The **Form Guide** feature on Wisden match pages was the original target of this investigation. Key findings:

1. **Intended Endpoint:** `/cricket/v1/team/form` exists but returns no data (404/empty)
2. **Likely Implementation:** Form guide is calculated on the frontend using recent match results from `/cricket/v1/schedule?is_recent=true&team_id={ID}`
3. **Alternative:** You can fetch last 5-10 matches for a team and calculate W/L/D form yourself

### All APIs Use Same Client ID

All these v1 cricket APIs use the same `client_id` as the scorecard and H2H APIs:

- `client_id`: `430fdd0d` (documented as `CLIENT_SCORECARD` in `wisdenConfig.ts`)

### Common Parameters

Most APIs share these parameters:

- `lang`: `en` (language)
- `feed_format`: `json` (response format)
- `client_id`: `430fdd0d` (authentication)

---

## Recommendations

1. **Update `wisdenapidoc.md`** with the working APIs, especially:
   - Team Profile
   - Team Schedule (for form calculation)
   - Rankings (all types)
   - Player Profile
   - Venue
   - Series

2. **Implement Form Guide** using the Team Schedule API:

   ```typescript
   // Pseudo-code
   const response = await fetch(
     schedule_api + "?is_recent=true&team_id=1126&page_size=5",
   );
   const form = response.matches.map((m) => {
     if (m.winning_team_id === teamId) return "W";
     if (m.match_status.includes("Tied")) return "T";
     if (m.match_status.includes("Draw")) return "D";
     return "L";
   });
   ```

3. **Use Rankings API** for displaying team/player rankings in your app

4. **Use Player/Venue APIs** for enhanced match detail pages

---

## Testing via CORS Proxy

All URLs must be encoded and passed through the CORS proxy:

```typescript
const CORS_PROXY = "https://cricket-proxy.boxboxcric.workers.dev/?url=";
const apiUrl =
  "https://www.wisden.com/cricket/v1/team?team_id=1126&lang=en&feed_format=json&client_id=430fdd0d";
const finalUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;
```

---

## Summary Table

| API              | Endpoint                         | Status     | Sample Size | Primary Use                                   |
| :--------------- | :------------------------------- | :--------- | :---------- | :-------------------------------------------- |
| Team Profile     | `/cricket/v1/team`               | ✅ Working | 313KB       | Team info, coach, history                     |
| Team Schedule    | `/cricket/v1/schedule`           | ✅ Working | 41KB        | Recent/upcoming matches, **form calculation** |
| Rankings         | `/cricket/v1/ranking`            | ✅ Working | 37-48KB     | ICC rankings (teams/players)                  |
| Player Profile   | `/cricket/v1/player`             | ✅ Working | 412KB       | Player bio, stats, socials                    |
| Venue            | `/cricket/v1/venue`              | ✅ Working | 316KB       | Venue info, stats, records                    |
| Series           | `/cricket/v1/series`             | ✅ Working | 2.1KB       | Series info, results                          |
| Team Form        | `/cricket/v1/team/form`          | ❌ Empty   | 0B          | Intended for form guide                       |
| Squad            | `/cricket/v1/game/squad`         | ❌ Empty   | 0B          | Match squads                                  |
| Match Details    | `/cricket/v1/game/match-details` | ❌ Empty   | 0B          | Match metadata                                |
| Series Standings | `/cricket/v1/series/standings`   | ❌ Empty   | 0B          | Points table                                  |
