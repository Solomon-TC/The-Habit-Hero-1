-- Drop existing RLS policies for friendships table
DROP POLICY IF EXISTS "Users can insert their own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;

-- Disable RLS on friendships table
ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;

-- Enable realtime for friendships table
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
