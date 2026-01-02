-- Migration: Create Tournament Stats Tables
-- Date: 2026-01-03
-- Purpose: Store player innings data for premium tournaments (P1-15)

-------------------------------------------------------------------------------
-- Table: tournament_matches
-- Stores match metadata for premium tournaments only
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournament_matches (
  id TEXT PRIMARY KEY,                         -- Match ID (e.g., "ckbc03222024237771")
  series_id TEXT NOT NULL,                     -- Series ID
  series_name TEXT NOT NULL,                   -- "Indian Premier League, 2024"
  match_date DATE NOT NULL,
  match_type TEXT,                             -- Test/ODI/T20
  venue_id TEXT,
  venue_name TEXT,
  venue_city TEXT,
  venue_country TEXT,
  pitch_suited_for TEXT,                       -- "Batting friendly", "Bowling friendly"
  toss_winner_id TEXT,
  toss_elected_to TEXT,                        -- "bat" or "field"
  team_home_id TEXT NOT NULL,
  team_away_id TEXT NOT NULL,
  result TEXT,                                 -- Match result text
  priority INT,                                -- From getMatchPriority() (1-15 = premium)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tm_series ON tournament_matches(series_id);
CREATE INDEX IF NOT EXISTS idx_tm_date ON tournament_matches(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_tm_priority ON tournament_matches(priority);

-------------------------------------------------------------------------------
-- Table: batting_innings
-- Stores individual batting performances per match/innings
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS batting_innings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
  innings_number INT NOT NULL,                 -- 1, 2, 3, 4 (Test can have 4)
  player_id TEXT NOT NULL,                     -- Player ID from API
  player_name TEXT NOT NULL,                   -- Denormalized for fast queries
  team_id TEXT NOT NULL,                       -- Batting team ID
  batting_position INT,                        -- 1-11
  runs INT DEFAULT 0,
  balls INT DEFAULT 0,
  fours INT DEFAULT 0,
  sixes INT DEFAULT 0,
  dots INT DEFAULT 0,
  strike_rate REAL,                            -- Calculated SR
  is_out BOOLEAN DEFAULT false,
  dismissal_type TEXT,                         -- "bowled", "caught", "lbw", "run out", etc.
  dismissed_by_id TEXT,                        -- Bowler who took the wicket
  fielder_id TEXT,                             -- Who caught/stumped
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bi_match ON batting_innings(match_id);
CREATE INDEX IF NOT EXISTS idx_bi_player ON batting_innings(player_id);
CREATE INDEX IF NOT EXISTS idx_bi_runs ON batting_innings(runs DESC);

-------------------------------------------------------------------------------
-- Table: bowling_innings
-- Stores individual bowling performances per match/innings
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bowling_innings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
  innings_number INT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,                   -- Denormalized
  team_id TEXT NOT NULL,                       -- Bowling team ID
  overs REAL,                                  -- e.g., 4.3  
  balls_bowled INT DEFAULT 0,
  maidens INT DEFAULT 0,
  runs INT DEFAULT 0,
  wickets INT DEFAULT 0,
  dots INT DEFAULT 0,
  economy REAL,
  wides INT DEFAULT 0,
  noballs INT DEFAULT 0,
  avg_speed REAL,                              -- Bowling speed in km/h 🔥
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bwi_match ON bowling_innings(match_id);
CREATE INDEX IF NOT EXISTS idx_bwi_player ON bowling_innings(player_id);
CREATE INDEX IF NOT EXISTS idx_bwi_wickets ON bowling_innings(wickets DESC);
CREATE INDEX IF NOT EXISTS idx_bwi_speed ON bowling_innings(avg_speed DESC);

-------------------------------------------------------------------------------
-- Table: players (optional lookup table)
-- Stores player metadata for enriching queries
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,                         -- Player ID
  name TEXT NOT NULL,
  name_short TEXT,
  nationality TEXT,
  skill TEXT,                                  -- "Batsman", "Bowler", "All-Rounder", "Wicket Keeper"
  batting_style TEXT,                          -- "RHB", "LHB"
  bowling_style TEXT,                          -- "RF", "LF", "OB", "SLO"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-------------------------------------------------------------------------------
-- Row Level Security (Public Read)
-------------------------------------------------------------------------------
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batting_innings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bowling_innings ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON tournament_matches FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON batting_innings FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON bowling_innings FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON players FOR SELECT USING (true);

-------------------------------------------------------------------------------
-- Useful Views for Stats
-------------------------------------------------------------------------------

-- View: Top Run Scorers per Series
CREATE OR REPLACE VIEW top_run_scorers AS
SELECT 
  bi.player_id,
  bi.player_name,
  tm.series_id,
  tm.series_name,
  COUNT(*) as innings,
  SUM(bi.runs) as total_runs,
  SUM(bi.fours) as total_fours,
  SUM(bi.sixes) as total_sixes,
  ROUND(AVG(bi.strike_rate)::numeric, 2) as avg_strike_rate,
  MAX(bi.runs) as high_score
FROM batting_innings bi
JOIN tournament_matches tm ON bi.match_id = tm.id
GROUP BY bi.player_id, bi.player_name, tm.series_id, tm.series_name;

-- View: Top Wicket Takers per Series
CREATE OR REPLACE VIEW top_wicket_takers AS
SELECT 
  bwi.player_id,
  bwi.player_name,
  tm.series_id,
  tm.series_name,
  COUNT(*) as innings,
  SUM(bwi.wickets) as total_wickets,
  SUM(bwi.runs) as runs_conceded,
  ROUND(AVG(bwi.economy)::numeric, 2) as avg_economy,
  ROUND(AVG(bwi.avg_speed)::numeric, 2) as avg_speed_kmh
FROM bowling_innings bwi
JOIN tournament_matches tm ON bwi.match_id = tm.id
GROUP BY bwi.player_id, bwi.player_name, tm.series_id, tm.series_name;

-- View: Fastest Bowlers (min 5 innings)
CREATE OR REPLACE VIEW fastest_bowlers AS
SELECT 
  bwi.player_id,
  bwi.player_name,
  COUNT(*) as innings,
  ROUND(AVG(bwi.avg_speed)::numeric, 2) as avg_speed_kmh,
  MAX(bwi.avg_speed) as max_speed_kmh
FROM bowling_innings bwi
WHERE bwi.avg_speed > 0
GROUP BY bwi.player_id, bwi.player_name
HAVING COUNT(*) >= 5
ORDER BY avg_speed_kmh DESC;
