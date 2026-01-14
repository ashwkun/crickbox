-- Change profiles.id from UUID to TEXT to support Firebase UIDs
-- Must drop policies first as they depend on the column type

BEGIN;

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 2. Drop the foreign key constraint (if any)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Change the column type
ALTER TABLE profiles ALTER COLUMN id TYPE text;

-- 4. Re-create policies (strict RLS)
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid()::text = id);

COMMIT;
