-- Nuclear Option 2: Recreate table with distinct column name
-- To ensure no cache/uuid ambiguity.

BEGIN;

-- 1. Drop the suspicious table entirely
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 2. Create fresh with explicit name
CREATE TABLE user_profiles (
    firebase_uid text PRIMARY KEY, -- Renamed from uid to firebase_uid
    display_name text,
    created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Strict Policies
CREATE POLICY "Users can view own profile" ON user_profiles 
  FOR SELECT USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can insert own profile" ON user_profiles 
  FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can update own profile" ON user_profiles 
  FOR UPDATE USING (auth.uid()::text = firebase_uid);

-- 5. Reload Schema
NOTIFY pgrst, 'reload config';

COMMIT;
