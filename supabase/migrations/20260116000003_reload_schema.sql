-- Force PostgREST schema cache reload
-- This is sometimes necessary after altering column types
NOTIFY pgrst, 'reload config';
