-- Drop tables if they exist
DROP TABLE IF EXISTS friend_requests;
DROP TABLE IF EXISTS friendships;

-- Remove tables from realtime publication
BEGIN;
  -- Check if tables exist in the publication before trying to remove them
  DO $$
  BEGIN
    -- For friend_requests table
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'friend_requests'
    ) THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE friend_requests;
    END IF;
    
    -- For friendships table
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'friendships'
    ) THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE friendships;
    END IF;
  END
  $$;
COMMIT;
