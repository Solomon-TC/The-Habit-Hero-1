-- Create a more reliable function to get user by ID
CREATE OR REPLACE FUNCTION get_user_by_id(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  level INTEGER,
  xp INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.full_name,
    u.email,
    u.avatar_url,
    COALESCE(u.level, 1) as level,
    COALESCE(u.xp, 0) as xp
  FROM users u
  WHERE u.id = user_id;
  
  -- If no rows returned, insert a placeholder user
  IF NOT FOUND THEN
    INSERT INTO users (id, name, email, level, xp, created_at)
    VALUES (
      user_id,
      'User ' || substring(user_id::text, 1, 8),
      'user_' || substring(user_id::text, 1, 8) || '@example.com',
      1,
      0,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id, name, full_name, email, avatar_url, level, xp;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;