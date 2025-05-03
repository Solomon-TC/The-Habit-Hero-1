-- First, ensure RLS is enabled on the friendships table
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can create their own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can manage their own friendships" ON friendships;

-- Create policy for viewing friendships
CREATE POLICY "Users can view their own friendships"
ON friendships
FOR SELECT
USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Create policy for inserting friendships
CREATE POLICY "Users can create their own friendships"
ON friendships
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Create policy for updating and deleting friendships
CREATE POLICY "Users can manage their own friendships"
ON friendships
FOR UPDATE
USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Create policy for deleting friendships
CREATE POLICY "Users can delete their own friendships"
ON friendships
FOR DELETE
USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- The table is already part of the realtime publication because supabase_realtime is defined as FOR ALL TABLES