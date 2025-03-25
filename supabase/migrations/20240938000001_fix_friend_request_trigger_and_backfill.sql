-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS friend_request_accepted_trigger ON friend_requests;
DROP FUNCTION IF EXISTS handle_friend_request_acceptance();

-- Create an improved function that will be triggered when a friend request is accepted
CREATE OR REPLACE FUNCTION handle_friend_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the status was changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    -- Log the friendship creation attempt for debugging
    RAISE NOTICE 'Creating friendship between % and %', NEW.receiver_id, NEW.sender_id;
    
    -- Check if friendship already exists to avoid duplicates
    IF NOT EXISTS (
      SELECT 1 FROM friends 
      WHERE (user_id = NEW.receiver_id AND friend_id = NEW.sender_id) 
         OR (user_id = NEW.sender_id AND friend_id = NEW.receiver_id)
    ) THEN
      -- Create two friendship records (one for each user)
      INSERT INTO friends (user_id, friend_id, created_at)
      VALUES 
        (NEW.receiver_id, NEW.sender_id, NOW()),
        (NEW.sender_id, NEW.receiver_id, NOW());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the friend_requests table
CREATE TRIGGER friend_request_accepted_trigger
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_friend_request_acceptance();

-- Backfill friendships for existing accepted friend requests that don't have corresponding friendship records
DO $$
DECLARE
  req RECORD;
BEGIN
  -- Loop through all accepted friend requests
  FOR req IN 
    SELECT * FROM friend_requests WHERE status = 'accepted'
  LOOP
    -- Check if a friendship record already exists
    IF NOT EXISTS (
      SELECT 1 FROM friends 
      WHERE (user_id = req.receiver_id AND friend_id = req.sender_id) 
         OR (user_id = req.sender_id AND friend_id = req.receiver_id)
    ) THEN
      -- Create the friendship records
      INSERT INTO friends (user_id, friend_id, created_at)
      VALUES 
        (req.receiver_id, req.sender_id, NOW()),
        (req.sender_id, req.receiver_id, NOW());
      
      RAISE NOTICE 'Created missing friendship between % and % for request %', 
        req.receiver_id, req.sender_id, req.id;
    END IF;
  END LOOP;
  
  -- Log the total count of friendships after backfill
  RAISE NOTICE 'Total friendships after backfill: %', 
    (SELECT COUNT(*) FROM friends);
END;
$$;

-- Ensure the friends table is in the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'friends'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE friends;
  END IF;
END
$$;
