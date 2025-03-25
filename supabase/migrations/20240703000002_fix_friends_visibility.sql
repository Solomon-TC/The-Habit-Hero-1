-- Drop the existing policy that's too restrictive
DROP POLICY IF EXISTS "Users can view their own friends" ON friends;

-- Create a more permissive policy that allows users to see friendships where they are either user_id or friend_id
CREATE POLICY "Users can view friendships they are part of"
  ON friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Ensure realtime is enabled
alter publication supabase_realtime add table friends;