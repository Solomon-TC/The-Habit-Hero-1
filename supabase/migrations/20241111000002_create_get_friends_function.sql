-- Create a function to get friends with their display names
CREATE OR REPLACE FUNCTION get_friends_with_display_names(user_id UUID)
RETURNS TABLE (
  friend_id UUID,
  name TEXT,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  level INTEGER,
  xp INTEGER,
  display_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.friend_id,
    u.name,
    u.full_name,
    u.email,
    u.avatar_url,
    u.level,
    u.xp,
    COALESCE(u.display_name, u.full_name, u.name, u.email) as display_name
  FROM 
    friendships f
  JOIN 
    users u ON f.friend_id = u.id
  WHERE 
    f.user_id = $1;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_friends_with_display_names(UUID) TO authenticated;
