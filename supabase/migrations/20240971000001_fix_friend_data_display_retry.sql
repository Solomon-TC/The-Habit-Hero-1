-- Create a function to search users by ID if it doesn't exist yet
CREATE OR REPLACE FUNCTION search_user_by_id(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  full_name TEXT,
  level INTEGER,
  xp INTEGER,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.full_name,
    u.level,
    u.xp,
    u.avatar_url
  FROM users u
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create an index on the friends table to improve query performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);

-- Note: We're not modifying the supabase_realtime publication as it's already set to FOR ALL TABLES