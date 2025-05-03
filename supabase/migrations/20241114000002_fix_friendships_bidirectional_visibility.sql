-- Add policy to allow users to view friendships where they are the friend_id
DROP POLICY IF EXISTS "Users can view friendships where they are the friend" ON friendships;
CREATE POLICY "Users can view friendships where they are the friend"
  ON friendships
  FOR SELECT
  USING (auth.uid() = friend_id);

-- Create a function to get friends with display names that works bidirectionally
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
  -- Get friends where the user is the user_id
  SELECT 
    f.friend_id,
    u.raw_user_meta_data->>'name' as name,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.email,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    (u.raw_user_meta_data->>'level')::INTEGER as level,
    (u.raw_user_meta_data->>'xp')::INTEGER as xp,
    COALESCE(
      u.raw_user_meta_data->>'display_name',
      u.raw_user_meta_data->>'name',
      u.raw_user_meta_data->>'full_name',
      split_part(u.email, '@', 1)
    ) as display_name
  FROM friendships f
  JOIN auth.users u ON f.friend_id = u.id
  WHERE f.user_id = get_friends_with_display_names.user_id
  
  UNION
  
  -- Get friends where the user is the friend_id
  SELECT 
    f.user_id as friend_id,
    u.raw_user_meta_data->>'name' as name,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.email,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    (u.raw_user_meta_data->>'level')::INTEGER as level,
    (u.raw_user_meta_data->>'xp')::INTEGER as xp,
    COALESCE(
      u.raw_user_meta_data->>'display_name',
      u.raw_user_meta_data->>'name',
      u.raw_user_meta_data->>'full_name',
      split_part(u.email, '@', 1)
    ) as display_name
  FROM friendships f
  JOIN auth.users u ON f.user_id = u.id
  WHERE f.friend_id = get_friends_with_display_names.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_friends_with_display_names(UUID) TO authenticated;
