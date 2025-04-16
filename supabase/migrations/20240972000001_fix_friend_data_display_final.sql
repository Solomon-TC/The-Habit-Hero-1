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

-- Add a function to ensure friend users exist
CREATE OR REPLACE FUNCTION ensure_friend_user_exists(friend_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = friend_id) THEN
    -- Create placeholder user if not exists
    INSERT INTO users (id, email, name, created_at, level, xp)
    VALUES (friend_id, 'user_' || friend_id || '@example.com', 'User ' || substring(friend_id::text, 1, 8), now(), 1, 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
