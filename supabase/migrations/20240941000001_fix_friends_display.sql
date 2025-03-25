-- Ensure the friends table has the correct indexes for efficient querying
CREATE INDEX IF NOT EXISTS friends_user_id_idx ON friends(user_id);
CREATE INDEX IF NOT EXISTS friends_friend_id_idx ON friends(friend_id);

-- Ensure the friends table is included in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE friends;

-- Ensure the users table is included in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Ensure the friend_requests table is included in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;

-- Ensure the friends table has the correct RLS policies
DROP POLICY IF EXISTS "Users can view their own friends" ON friends;
CREATE POLICY "Users can view their own friends"
  ON friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Ensure the friend_requests table has the correct RLS policies
DROP POLICY IF EXISTS "Users can view their own friend requests" ON friend_requests;
CREATE POLICY "Users can view their own friend requests"
  ON friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
