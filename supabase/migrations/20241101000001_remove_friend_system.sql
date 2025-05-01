-- Drop all friend-related tables and functions
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;

-- Drop any related functions
DROP FUNCTION IF EXISTS search_users_by_email(search_query text);
DROP FUNCTION IF EXISTS search_users_by_id(search_query text);

-- Remove any realtime publications for these tables
BEGIN;
  -- This is safe to run even if the tables don't exist in the publication
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS friend_requests;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS friendships;
COMMIT;
