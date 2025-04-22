-- First drop the existing function
DROP FUNCTION IF EXISTS get_user_by_id(uuid);

-- Create a simplified version that works with existing tables
CREATE FUNCTION get_user_by_id(user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  full_name text,
  email text,
  avatar_url text,
  level integer,
  xp integer
) AS $$
BEGIN
  -- Try to get the user data
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
    ON CONFLICT (id) DO NOTHING;
    
    -- Return the newly created user
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
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;