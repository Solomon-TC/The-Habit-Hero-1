-- Check if the friends table exists and create it if not
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Enable realtime for the friends table
ALTER PUBLICATION supabase_realtime ADD TABLE friends;

-- Ensure RLS is disabled for the friends table (it's disabled by default, but just to be explicit)
ALTER TABLE friends DISABLE ROW LEVEL SECURITY;
