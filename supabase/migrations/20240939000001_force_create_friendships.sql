-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS friend_request_accepted_trigger ON friend_requests;
DROP FUNCTION IF EXISTS handle_friend_request_acceptance();

-- Create an improved function with better error handling
CREATE OR REPLACE FUNCTION handle_friend_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the status was changed to 'accepted'
  IF NEW.status = 'accepted' THEN
    -- Force insert friendship records regardless of existing records
    BEGIN
      -- First record
      INSERT INTO friends (user_id, friend_id, created_at)
      VALUES (NEW.receiver_id, NEW.sender_id, NOW());
      
      -- Second record
      INSERT INTO friends (user_id, friend_id, created_at)
      VALUES (NEW.sender_id, NEW.receiver_id, NOW());
      
      EXCEPTION WHEN unique_violation THEN
        -- If records already exist, just continue
        RAISE NOTICE 'Friendship already exists between % and %', NEW.receiver_id, NEW.sender_id;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the friend_requests table
CREATE TRIGGER friend_request_accepted_trigger
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_friend_request_acceptance();

-- Force create friendships for all accepted requests
DO $$
DECLARE
  req RECORD;
BEGIN
  -- First, delete any existing friendship records to avoid conflicts
  DELETE FROM friends;
  
  -- Loop through all accepted friend requests and create friendships
  FOR req IN 
    SELECT * FROM friend_requests WHERE status = 'accepted'
  LOOP
    -- Insert both friendship records
    INSERT INTO friends (user_id, friend_id, created_at)
    VALUES 
      (req.receiver_id, req.sender_id, NOW()),
      (req.sender_id, req.receiver_id, NOW());
      
    RAISE NOTICE 'Created friendship between % and % for request %', 
      req.receiver_id, req.sender_id, req.id;
  END LOOP;
  
  -- Log the total count of friendships after creation
  RAISE NOTICE 'Total friendships after creation: %', 
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