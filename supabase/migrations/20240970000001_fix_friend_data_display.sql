-- Ensure the users table has proper indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- Create a more reliable function to get user data by ID
CREATE OR REPLACE FUNCTION get_user_by_id(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  full_name TEXT,
  email TEXT,
  level INTEGER,
  xp INTEGER,
  avatar_url TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.full_name,
    u.email,
    u.level,
    u.xp,
    u.avatar_url
  FROM users u
  WHERE u.id = user_id;
END;
$$;

-- Ensure the users table is included in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE users;
