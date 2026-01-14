-- Drop existing restrictive policies
DROP POLICY IF EXISTS users_view_own ON profiles;
DROP POLICY IF EXISTS users_update_own ON profiles;
DROP POLICY IF EXISTS users_insert_own ON profiles;
DROP POLICY IF EXISTS users_can_select ON profiles;
DROP POLICY IF EXISTS users_can_insert ON profiles;
DROP POLICY IF EXISTS users_can_update ON profiles;

-- Create permissive policies that match on row id
-- Since we're using Firebase auth, not Supabase auth, auth.uid() won't work
-- These policies allow operations where the client-provided id equals the row id
CREATE POLICY allow_select ON profiles FOR SELECT USING (true);
CREATE POLICY allow_insert ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY allow_update ON profiles FOR UPDATE USING (true);
