-- Drop permissive policies (from validation step)
DROP POLICY IF EXISTS allow_select ON profiles;
DROP POLICY IF EXISTS allow_insert ON profiles;
DROP POLICY IF EXISTS allow_update ON profiles;

-- Drop any other legacy permissive policies just in case
DROP POLICY IF EXISTS users_can_select ON profiles;
DROP POLICY IF EXISTS users_can_insert ON profiles;
DROP POLICY IF EXISTS users_can_update ON profiles;

-- Re-enable strict RLS
-- auth.uid() comes from the valid Firebase JWT passed in the Authorization header
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid()::text = id);
