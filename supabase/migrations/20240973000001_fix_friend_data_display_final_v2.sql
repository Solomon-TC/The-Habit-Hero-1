-- Create a function to get user by ID that doesn't rely on the users table directly
CREATE OR REPLACE FUNCTION get_user_by_id(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  level INTEGER,
  xp INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.full_name,
    u.email,
    u.avatar_url,
    u.level,
    u.xp,
    u.created_at
  FROM users u
  WHERE u.id = user_id;
  
  -- If no rows returned, return NULL values
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to ensure a friend user exists
CREATE OR REPLACE FUNCTION ensure_friend_user_exists(friend_id UUID)
RETURNS VOID AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if the user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE id = friend_id) INTO user_exists;
  
  -- If the user doesn't exist, create a placeholder
  IF NOT user_exists THEN
    INSERT INTO users (id, name, email, created_at)
    VALUES (
      friend_id,
      'User ' || substring(friend_id::text, 1, 8),
      'user_' || substring(friend_id::text, 1, 8) || '@example.com',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to ensure all friend users exist
CREATE OR REPLACE FUNCTION ensure_friend_users_exist()
RETURNS VOID AS $$
DECLARE
  friend_record RECORD;
BEGIN
  FOR friend_record IN SELECT DISTINCT friend_id FROM friends LOOP
    PERFORM ensure_friend_user_exists(friend_record.friend_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We're not modifying the publication since it's already FOR ALL TABLES
