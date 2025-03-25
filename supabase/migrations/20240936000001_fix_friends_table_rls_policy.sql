-- Drop existing policies on the friends table
DROP POLICY IF EXISTS "Users can view their own friends" ON friends;
DROP POLICY IF EXISTS "Users can manage their own friends" ON friends;
DROP POLICY IF EXISTS "Users can insert their own friends" ON friends;
DROP POLICY IF EXISTS "Users can delete their own friends" ON friends;

-- Enable RLS on the friends table
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to view their own friends
CREATE POLICY "Users can view their own friends"
ON friends FOR SELECT
USING (auth.uid() = user_id);

-- Create a policy that allows users to insert their own friends
CREATE POLICY "Users can insert their own friends"
ON friends FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows users to delete their own friends
CREATE POLICY "Users can delete their own friends"
ON friends FOR DELETE
USING (auth.uid() = user_id);

-- Remove the friends table from the realtime publication if it exists, then add it again
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS friends;
ALTER PUBLICATION supabase_realtime ADD TABLE friends;
