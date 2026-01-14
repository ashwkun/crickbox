-- Force replace id column to ensure it is TEXT
-- This avoids "alter column" issues by doing a full swap

BEGIN;

-- 1. Create new text column
ALTER TABLE profiles ADD COLUMN id_text text;

-- 2. Copy data (if any)
UPDATE profiles SET id_text = id::text;

-- 3. Drop old column CASCADE (removes policies, PKs, constraints depending on it)
ALTER TABLE profiles DROP COLUMN id CASCADE;

-- 4. Rename new column
ALTER TABLE profiles RENAME COLUMN id_text TO id;

-- 5. Restore Primary Key
ALTER TABLE profiles ADD PRIMARY KEY (id);

-- 6. Restore Policies (Strict RLS)
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid()::text = id);

-- 7. Force schema reload
NOTIFY pgrst, 'reload config';

COMMIT;
