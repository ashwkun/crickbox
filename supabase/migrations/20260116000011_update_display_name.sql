-- User requested that display_name should be just the first_name.
-- We keep display_name as a column for backward compatibility (app usage),
-- but we update its content to match first_name.

BEGIN;

-- 1. Update display_name to be first_name
UPDATE profiles 
SET display_name = first_name
WHERE first_name IS NOT NULL;

-- 2. Reload Schema (just in case)
NOTIFY pgrst, 'reload config';

COMMIT;
