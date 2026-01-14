-- The uid column is confirmed to still be UUID
-- We must force it to be TEXT by dropping dependencies FIRST

BEGIN;

-- 1. Drop existing policies (CRITICAL: Must be done before altering column)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 2. Drop constraints that might prevent type change
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_uid_key;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- 3. Force type change to text
ALTER TABLE profiles ALTER COLUMN uid TYPE text;

-- 4. Restore Primary Key
ALTER TABLE profiles ADD PRIMARY KEY (uid);

-- 5. Re-create policies (Strict RLS)
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid()::text = uid);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid()::text = uid);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid()::text = uid);

-- 6. Reload Schema
NOTIFY pgrst, 'reload config';

COMMIT;
