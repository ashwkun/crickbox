# Wisden API Documentation

## Overview
Wisden provides several undocumented APIs for cricket data. These are used by their public website and can be accessed via CORS proxy.

## Base Configuration

| Parameter | Value |
|-----------|-------|
| CORS Proxy | `https://cricket-proxy.boxboxcric.workers.dev/?url=` |
| Sport ID | `1` (Cricket) |
| Language | `en` |
| Timezone | `0530` (IST) |

---

## API Endpoints

### 1. Matches List
Returns all matches (live, upcoming, completed) based on filters.

```
https://www.wisden.com/default.aspx?methodtype=3&client=e656463796&sport=1&league=0&timezone=0530&language=en
```

| Parameter | Value | Description |
|-----------|-------|-------------|
| `client` | `e656463796` | Required client identifier |
| `gamestate` | `1` / `2` | 1=Live, 2=Upcoming (optional) |
| `days` | `10` | Upcoming days range (optional) |
| `daterange` | `DDMMYYYY-DDMMYYYY` | Date range filter (optional) |

**Response Structure:**
```json
{
  "matches": [
    {
      "game_id": "auen12042025253243",
      "series_id": "8273",
      "series_name": "The Ashes, 2025/26",
      "event_name": "2nd Test",
      "event_state": "L" | "U" | "R",
      "event_status": "Day 2 - Session 1",
      "event_sub_status": "Australia trail by 150 runs",
      "short_event_status": "AUS beat ENG by 8 wickets",
      "event_format": "test" | "odi" | "t20",
      "start_date": "2025-12-04T04:00:00",
      "venue_name": "Adelaide Oval, Adelaide",
      "result_code": "W" | "D",
      "winning_margin": "8 wickets",
      "participants": [
        {
          "id": "1",
          "name": "Australia",
          "short_name": "AUS",
          "value": "445 (117.1) & 89/7 dec",
          "highlight": "true"  // Winner indicator
        }
      ]
    }
  ]
}
```

---

### 2. Scorecard
Returns detailed scorecard for a specific match.

```
https://www.wisden.com/cricket/v1/game/scorecard?game_id={game_id}&lang=en&feed_format=json&client_id=430fdd0d
```

| Parameter | Value | Description |
|-----------|-------|-------------|
| `client_id` | `430fdd0d` | Required client identifier |
| `game_id` | `auen12042025253243` | Match identifier from matches list |

**Response Structure:**
```json
{
  "Matchdetail": {
    "Team_Home": "Australia",
    "Team_Away": "England",
    "Toss": "Australia won the toss and elected to bat",
    "Match_Date": "Dec 04 - Dec 08, 2025"
  },
  "Innings": [
    {
      "Battingteam": "Australia",
      "Total": "445/10",
      "Overs": "117.1",
      "Batsmen": [
        {
          "Batsman": "Steve Smith",
          "Runs": "140",
          "Balls": "211",
          "Fours": "15",
          "Sixes": "2",
          "Strikerate": "66.35",
          "Howout": "c Root b Anderson"
        }
      ],
      "Bowlers": [
        {
          "Bowler": "James Anderson",
          "Overs": "28",
          "Maidens": "8",
          "Runs": "67",
          "Wickets": "4",
          "Econ": "2.39"
        }
      ],
      "FallofWickets": ["1-34", "2-89", "3-156"],
      "Partnerships": [
        {
          "Runs": "89",
          "Balls": "145",
          "Player1": "Warner",
          "Player2": "Smith"
        }
      ]
    }
  ]
}
```

---

### 3. Wallstream (Ball-by-Ball Commentary) 🆕
Returns live ball-by-ball commentary with rich metadata.

```
https://www.wisden.com/functions/wallstream/?sport_id=1&client_id=lx/QMpdauKZQKYaddAs76w==&match_id={match_id}&page_size=15&page_no=1&session=2
```

| Parameter | Value | Description |
|-----------|-------|-------------|
| `client_id` | `lx/QMpdauKZQKYaddAs76w==` | Required (URL-encoded) |
| `match_id` | `268741` | Numeric match ID (from game_id) |
| `page_size` | `15` | Number of entries per page |
| `page_no` | `1` | Page number (1 = latest) |
| `session` | `2` | Session number |

**Note:** The `match_id` is the numeric portion extracted from `game_id`. For example:
- `game_id`: `cabidn12252025268741`
- `match_id`: `268741` (last 6 digits)

**Response Structure:**
```json
{
  "assets": [
    {
      "id": 40423346,
      "type": "Commentary",
      "headline": "19.4 Rahayu to Shuayeb, 0 Run",
      "publish_time": "2025-12-25T09:28:22.207",
      "custom_metadata": {
        "asset": "{\"Over\":\"19.4\",\"Runs\":\"0\",\"Detail\":\"\",...}"
      }
    }
  ]
}
```

**Parsed `custom_metadata.asset`:**
```json
{
  "Over": "19.4",
  "OverNo": "20",
  "BallNo": "4",
  "Runs": "0",
  "Detail": "",           // "w"=wicket, "4"=boundary, "6"=six
  "Isball": true,
  "Commentary": "No run, played towards third man.",
  
  // Current batsman details
  "Batsman_Name": "Alam Md Shuayeb",
  "Batsman_Details": {
    "name": "Alam Md Shuayeb",
    "Runs": "0",
    "Balls": "4",
    "Fours": "0",
    "Sixes": "0"
  },
  
  // Non-striker details
  "Non_Striker_Details": {
    "name": "Mongdara Sok",
    "Runs": "0",
    "Balls": "3"
  },
  
  // Bowler details
  "Bowler_Name": "Apriliandi Rahayu",
  "Bowler_Details": {
    "name": "Apriliandi Rahayu",
    "Overs": "3.4",
    "Maidens": "0",
    "Runs": "8",
    "Wickets": "2"
  },
  
  // Wagon wheel data
  "Zone": "3",
  "Angle": "112",
  "Distance": "4",
  
  // Current over
  "This_Over": "0,0,0,0,",
  "Ball_Number": "118"    // Total balls in innings
}
```

---

## Polling Intervals

| Data Type | Recommended Interval |
|-----------|---------------------|
| Live matches list | 15 seconds |
| Scorecard | 30 seconds |
| Ball-by-ball | 10-15 seconds |
| Upcoming/Results | 5 minutes |

---

## Client IDs Summary

| API | Client ID | Notes |
|-----|-----------|-------|
| Matches List | `e656463796` | Used in `client` param |
| Scorecard | `430fdd0d` | Used in `client_id` param |
| Wallstream | `lx/QMpdauKZQKYaddAs76w==` | Base64 encoded, URL-encode when using |

These are static identifiers embedded in Wisden's frontend code.

---

## Usage Example

```javascript
// Ball-by-ball commentary fetch
const WALLSTREAM_CLIENT = 'lx/QMpdauKZQKYaddAs76w==';
const matchId = '268741'; // Extract from game_id

const url = `https://www.wisden.com/functions/wallstream/?` +
  `sport_id=1&client_id=${encodeURIComponent(WALLSTREAM_CLIENT)}` +
  `&match_id=${matchId}&page_size=15&page_no=1&session=2`;

const data = await proxyFetch(url);
const balls = data.assets.map(a => JSON.parse(a.custom_metadata.asset));
```
