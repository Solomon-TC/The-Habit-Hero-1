-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS friend_request_accepted_trigger ON friend_requests;
DROP FUNCTION IF EXISTS handle_friend_request_acceptance();

-- Create an improved function with better error handling
CREATE OR REPLACE FUNCTION handle_friend_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the status was changed to 'accepted'
  IF NEW.status = 'accepted' THEN
    -- Force insert friendship records with error handling for duplicates
    BEGIN
      -- First record
      INSERT INTO friends (user_id, friend_id, created_at)
      VALUES (NEW.receiver_id, NEW.sender_id, NOW())
      ON CONFLICT (user_id, friend_id) DO NOTHING;
      
      -- Second record
      INSERT INTO friends (user_id, friend_id, created_at)
      VALUES (NEW.sender_id, NEW.receiver_id, NOW())
      ON CONFLICT (user_id, friend_id) DO NOTHING;
      
    EXCEPTION WHEN others THEN
      -- Log any errors
      RAISE NOTICE 'Error creating friendship: %', SQLERRM;
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

-- Force create friendships for all accepted requests with duplicate handling
DO $$
DECLARE
  req RECORD;
BEGIN
  -- Loop through all accepted friend requests and create friendships
  FOR req IN 
    SELECT * FROM friend_requests WHERE status = 'accepted'
  LOOP
    -- Skip self-referential friendships
    IF req.sender_id <> req.receiver_id THEN
      -- Insert both friendship records with conflict handling
      INSERT INTO friends (user_id, friend_id, created_at)
      VALUES 
        (req.receiver_id, req.sender_id, NOW())
      ON CONFLICT (user_id, friend_id) DO NOTHING;
      
      INSERT INTO friends (user_id, friend_id, created_at)
      VALUES
        (req.sender_id, req.receiver_id, NOW())
      ON CONFLICT (user_id, friend_id) DO NOTHING;
        
      RAISE NOTICE 'Created friendship between % and % for request %', 
        req.receiver_id, req.sender_id, req.id;
    ELSE
      RAISE NOTICE 'Skipping self-referential friendship for user %', req.sender_id;
    END IF;
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