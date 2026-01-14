-- Rename id to uid to fix persistent UUID type error
-- This also forces a fresh schema cache entry

BEGIN;

-- 1. Rename the column
ALTER TABLE profiles RENAME COLUMN id TO uid;

-- 2. Drop old policies (they reference "id")
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 3. Re-create policies using "uid"
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid()::text = uid);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid()::text = uid);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid()::text = uid);

-- 4. Force reload
NOTIFY pgrst, 'reload config';

COMMIT;
