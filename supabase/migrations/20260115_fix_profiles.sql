-- Drop existing table and recreate with TEXT id for Firebase UIDs
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies using auth.uid() cast to text for Firebase 3rd party auth
CREATE POLICY users_view_own ON profiles FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY users_update_own ON profiles FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY users_insert_own ON profiles FOR INSERT WITH CHECK (auth.uid()::text = id);
