-- Fix display name issues in the friend system

-- Update the search_user_by_id function to properly handle UUID comparisons
CREATE OR REPLACE FUNCTION search_user_by_id(search_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.name, u.full_name, u.display_name, u.avatar_url
  FROM users u
  WHERE u.id = search_id::UUID;
END;
$$ LANGUAGE plpgsql;