-- The 'profiles' table is stuck with a UUID column type despite migrations.
-- We are creating a fresh table 'user_profiles' to ensure correct schema.
-- This bypasses any stuck cache or failed migration states.

BEGIN;

CREATE TABLE IF NOT EXISTS user_profiles (
    uid text PRIMARY KEY, -- Explicitly TEXT to support Firebase UIDs
    display_name text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Strict RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles 
  FOR SELECT USING (auth.uid()::text = uid);

CREATE POLICY "Users can insert own profile" ON user_profiles 
  FOR INSERT WITH CHECK (auth.uid()::text = uid);

CREATE POLICY "Users can update own profile" ON user_profiles 
  FOR UPDATE USING (auth.uid()::text = uid);

-- Force reload just in case
NOTIFY pgrst, 'reload config';

COMMIT;
