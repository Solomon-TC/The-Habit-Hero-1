-- Create a function that will be triggered when a friend request is accepted
CREATE OR REPLACE FUNCTION handle_friend_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the status was changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
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
DROP TRIGGER IF EXISTS friend_request_accepted_trigger ON friend_requests;
CREATE TRIGGER friend_request_accepted_trigger
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_friend_request_acceptance();

-- Check if the friends table is already in the publication before adding it
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