-- Create matches table for cricket match data
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  match_date DATE NOT NULL,
  teama_id TEXT NOT NULL,
  teamb_id TEXT NOT NULL,
  teama TEXT,
  teamb TEXT,
  winner_id TEXT,
  result TEXT,
  league TEXT,
  series_id TEXT,
  series_name TEXT,
  venue TEXT,
  match_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast team-based queries
CREATE INDEX IF NOT EXISTS idx_matches_teama ON matches(teama_id);
CREATE INDEX IF NOT EXISTS idx_matches_teamb ON matches(teamb_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league);

-- Enable Row Level Security (allow public read)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON matches FOR SELECT USING (true);

-- Create a view for form calculation (matches with team involvement)
CREATE OR REPLACE VIEW team_matches AS
SELECT 
  id,
  match_date,
  teama_id,
  teamb_id,
  teama,
  teamb,
  winner_id,
  result,
  league,
  CASE 
    WHEN teama_id = teama_id THEN teama_id
    ELSE teamb_id
  END as team_id
FROM matches;

-- Function to get team form
CREATE OR REPLACE FUNCTION get_team_form(p_team_id TEXT, p_count INT DEFAULT 5)
RETURNS TABLE(match_id TEXT, match_date DATE, opponent TEXT, is_win BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.match_date,
    CASE WHEN m.teama_id = p_team_id THEN m.teamb ELSE m.teama END as opponent,
    (m.winner_id = p_team_id) as is_win
  FROM matches m
  WHERE m.teama_id = p_team_id OR m.teamb_id = p_team_id
  ORDER BY m.match_date DESC
  LIMIT p_count;
END;
$$ LANGUAGE plpgsql;
