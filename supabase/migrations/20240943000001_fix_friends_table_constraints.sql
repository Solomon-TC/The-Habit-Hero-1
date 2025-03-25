-- Add a unique constraint to prevent duplicate friendships
ALTER TABLE friends ADD CONSTRAINT unique_friendship UNIQUE (user_id, friend_id);

-- Ensure the friends table has proper indexes
DROP INDEX IF EXISTS idx_friends_user_id;
DROP INDEX IF EXISTS idx_friends_friend_id;
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);

-- Ensure the friends table has the correct RLS policies
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own friends" ON friends;
CREATE POLICY "Users can view their own friends"
  ON friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Ensure the friend_requests table has the correct RLS policies
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own friend requests" ON friend_requests;
CREATE POLICY "Users can view their own friend requests"
  ON friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Manually create some test friendships for debugging
DO $$
DECLARE
  current_user_id UUID;
  test_user_id UUID;
BEGIN
  -- Get a random user to create a friendship with
  SELECT id INTO test_user_id FROM users WHERE id != auth.uid() LIMIT 1;
  
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NOT NULL AND test_user_id IS NOT NULL THEN
    -- Insert friendship records with conflict handling
    INSERT INTO friends (user_id, friend_id, created_at)
    VALUES (current_user_id, test_user_id, NOW())
    ON CONFLICT (user_id, friend_id) DO NOTHING;
    
    INSERT INTO friends (user_id, friend_id, created_at)
    VALUES (test_user_id, current_user_id, NOW())
    ON CONFLICT (user_id, friend_id) DO NOTHING;
    
    RAISE NOTICE 'Created test friendship between % and %', current_user_id, test_user_id;
  END IF;
END;
$$;