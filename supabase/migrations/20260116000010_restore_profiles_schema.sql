-- RESTORE & CLEANUP MIGRATION
-- 1. Drop the broken 'profiles' table.
-- 2. Rename 'user_profiles' to 'profiles'.
-- 3. Rename 'firebase_uid' to 'id'.
-- 4. Add first_name / last_name.
-- 5. Backfill first/last name from display_name.

BEGIN;

-- 1. Drop old broken table
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Rename working table
ALTER TABLE user_profiles RENAME TO profiles;

-- 3. Rename column to standard 'id'
ALTER TABLE profiles RENAME COLUMN firebase_uid TO id;

-- 4. Add new columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name text;

-- 5. Backfill Data (Split Logic: First space separates First/Last)
-- substring(display_name from 1 for position(' ' in display_name)-1) -> First Name (if space exists)
-- substring(display_name from position(' ' in display_name)+1) -> Last Name
-- If no space, First Name = display_name, Last Name = null

UPDATE profiles 
SET 
  first_name = CASE 
    WHEN position(' ' in display_name) > 0 THEN substring(display_name from 1 for position(' ' in display_name)-1)
    ELSE display_name 
  END,
  last_name = CASE 
    WHEN position(' ' in display_name) > 0 THEN substring(display_name from position(' ' in display_name)+1)
    ELSE NULL 
  END;

-- 6. Apply Policies (Strict RLS with JWT Fix)
-- We need to drop old policies from user_profiles (now profiles) first just in case
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (
    (auth.jwt() ->> 'sub') = id
  );

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'sub') = id
  );

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (
    (auth.jwt() ->> 'sub') = id
  );

-- 7. Reload Schema
NOTIFY pgrst, 'reload config';

COMMIT;
