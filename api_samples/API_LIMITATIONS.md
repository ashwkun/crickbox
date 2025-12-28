# Wisden API Limitations & Known Issues

This document tracks known limitations and issues with Wisden Cricket APIs.

## 🚨 Critical Issues

### 1. Schedule API Returns Incorrect Data
**Affected Endpoint:** `/cricket/v1/schedule`

**Issue:** When querying by `series_id` or `team_id`, the API frequently returns data from completely different series/teams.

**Examples:**
- **IPL 2025** (`series_id=8307`): Returns Australian Women's cricket data from 2009
- **India Women** (`team_id=1126`): Returns data from wrong teams/series

**Status:** ❌ **BROKEN** - Do not use this endpoint

**Workarounds:**
1. **For Team Recent Matches:** Use the `/cricket/v1/team?series_id={ID}` endpoint which includes a `matches` array for each team
2. **For Series Fixtures:** Use the general matches list API with filters:
   ```
   /default.aspx?methodtype=3&client={CLIENT_MATCHES}&gamestate=2&league=2
   ```
   Then filter by series on the client side

**Impact:** High - Cannot reliably get team schedules or series fixtures

---

### 2. Player Statistics API Not Available
**Affected Endpoint:** `/cricket/v1/stats/player_level_stats`

**Issue:** Returns error: `"The requested resource does not exist in the database"`

**Tested Scenarios:**
- IPL 2025 (`comp_type_id=6`, various `stat_id` values)
- All stat types (Most Runs, Most Wickets, Orange Cap, Purple Cap)

**Status:** ❌ **NOT WORKING** for completed tournaments

**Theory:** This endpoint may only work for:
- Currently live/ongoing tournaments
- Specific championship structures
- May require different parameter combinations not yet discovered

**Workarounds:**
- **For Orange/Purple Cap:** Web scraping or alternative data sources
- **For Player Stats:** Aggregate from individual match scorecards

**Impact:** High - Cannot get tournament leaderboards or player rankings

---

### 3. Standings/Points Table API Not Available
**Affected Endpoints:**
- `/cricket/v1/standings`
- `/cricket/v1/series/standings`

**Issue:** Returns empty response (0 bytes)

**Tested Scenarios:**
- IPL 2025 (`series_id=8307`)

**Status:** ❌ **EMPTY RESPONSE**

**Workarounds:**
- Use `/cricket/v1/series?series_id={ID}` which includes:
  ```json
  {
    "teams": [
      {
        "id": 1105,
        "name": "Royal Challengers Bengaluru",
        "matches": 16,
        "wins": 11,
        "loss": 4,
        "draw": 0,
        "tied": 0
      }
    ]
  }
  ```
- Calculate points: `points = wins * 2`
- Sort by points, then by wins

**Impact:** Medium - Workaround available via series endpoint

---

## ⚠️ Partial Issues

### 4. Team Form Endpoint
**Affected Endpoint:** `/cricket/v1/team/form`

**Issue:** Returns 404/empty for most teams, especially women's cricket

**Status:** ⚠️ **UNRELIABLE**

**Workaround:** Calculate from recent matches via team schedule (if working) or series data

---

### 5. Squad Endpoint
**Affected Endpoint:** `/cricket/v1/game/squad`

**Issue:** Returns empty for tested matches

**Status:** ⚠️ **NEEDS MORE TESTING**

**Workaround:** Unknown - may require specific match types or live matches

---

## ✅ Reliable APIs

The following endpoints have been verified to work correctly:

1. **Matches List** - `/default.aspx?methodtype=3&gamestate={STATE}`
2. **Scorecard** - `/cricket/v1/game/scorecard?game_id={ID}`
3. **Head-to-Head** - `/cricket/v1/game/head-to-head?game_id={ID}`
4. **Wallstream (Ball-by-Ball)** - `/functions/wallstream/`
5. **Team Profile** - `/cricket/v1/team?team_id={ID}`
6. **Series Information** - `/cricket/v1/series?series_id={ID}`
7. **Rankings** - `/cricket/v1/ranking?comp_type={TYPE}&gender={G}&type={T}`
8. **Player Profile** - `/cricket/v1/player?player_id={ID}`
9. **Venue Information** - `/cricket/v1/venue?venue_id={ID}`

---

## Recommended Approach

### For Tournament Data:
```
1. Series Info → Get teams, dates, winner
2. Team Profile → Get team details, recent matches
3. Match Scorecard → Get individual match details
4. Aggregate → Calculate standings, stats, form on client side
```

### For Live Matches:
```
1. Matches List → Find live matches
2. Scorecard → Get current scores
3. Wallstream → Get ball-by-ball updates
4. H2H → Get historical context
```

### DON'T Use:
- ❌ `/cricket/v1/schedule` - Returns wrong data
- ❌ `/cricket/v1/stats/player_level_stats` - Not available
- ❌ `/cricket/v1/standings` - Empty response
- ❌ `/cricket/v1/team/form` - Unreliable

---

## Last Updated
December 28, 2025

## Notes
- These limitations were discovered during IPL 2025 API investigation
- Wisden's API documentation is not public; endpoints discovered through reverse engineering
- API behavior may change without notice
- Always implement error handling and fallbacks
