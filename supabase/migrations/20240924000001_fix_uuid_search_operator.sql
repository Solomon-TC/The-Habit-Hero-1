-- Drop the existing function
DROP FUNCTION IF EXISTS search_user_by_id(search_id UUID);

-- Recreate the function with fixed operator handling
CREATE OR REPLACE FUNCTION search_user_by_id(search_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Direct match by UUID
  RETURN QUERY
  SELECT u.id, u.email, u.name, u.avatar_url, u.created_at
  FROM users u
  WHERE u.id = search_id;
  
  -- If no results, try to find by text representation
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, u.avatar_url, u.created_at
    FROM users u
    WHERE u.id::text = search_id::text;
  END IF;
  
  -- If still no results, try partial match on the text representation
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, u.avatar_url, u.created_at
    FROM users u
    WHERE u.id::text LIKE '%' || search_id::text || '%';
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
