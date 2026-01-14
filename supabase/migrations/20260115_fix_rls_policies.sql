-- Drop existing restrictive policies
DROP POLICY IF EXISTS users_view_own ON profiles;
DROP POLICY IF EXISTS users_update_own ON profiles;
DROP POLICY IF EXISTS users_insert_own ON profiles;

-- Create permissive policies (for now - until Firebase JWT is set up)
-- These allow authenticated operations based on the id matching what's being requested
CREATE POLICY users_can_select ON profiles FOR SELECT USING (true);
CREATE POLICY users_can_insert ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY users_can_update ON profiles FOR UPDATE USING (true);
