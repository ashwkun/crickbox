-- The ROOT CAUSE has been identified:
-- auth.uid() casts the JWT 'sub' claim to a UUID.
-- Firebase UIDs are NOT UUIDs, causing the "invalid input syntax for type uuid" error inside the policy itself.
-- We must use (auth.jwt() ->> 'sub') to get the ID as TEXT.

BEGIN;

-- 1. Drop incorrect policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- 2. Create CORRECT policies using raw JWT sub claim (Text)
CREATE POLICY "Users can view own profile" ON user_profiles 
  FOR SELECT USING (
    (auth.jwt() ->> 'sub') = firebase_uid
  );

CREATE POLICY "Users can insert own profile" ON user_profiles 
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'sub') = firebase_uid
  );

CREATE POLICY "Users can update own profile" ON user_profiles 
  FOR UPDATE USING (
    (auth.jwt() ->> 'sub') = firebase_uid
  );

-- 3. Reload Schema
NOTIFY pgrst, 'reload config';

COMMIT;
