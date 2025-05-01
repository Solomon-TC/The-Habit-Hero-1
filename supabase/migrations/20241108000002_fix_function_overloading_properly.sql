-- Drop the existing functions to avoid conflicts
DROP FUNCTION IF EXISTS search_user_by_id(uuid);
DROP FUNCTION IF EXISTS search_user_by_id(text);
DROP FUNCTION IF EXISTS search_user_by_id_text(text);

-- Create a new function with a distinct name for text-based search
CREATE OR REPLACE FUNCTION search_user_by_id_text(search_id TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  level INTEGER
) AS $$
BEGIN
  -- First try direct UUID match if the input is a valid UUID
  BEGIN
    RETURN QUERY
    SELECT 
      u.id,
      u.name,
      u.full_name,
      u.email,
      u.avatar_url,
      u.level
    FROM 
      users u
    WHERE 
      u.id::text = search_id
    LIMIT 1;
    
    -- If we found a result, return it
    IF FOUND THEN
      RETURN;
    END IF;
  EXCEPTION
    WHEN others THEN
      -- If there's an error (like invalid UUID format), continue to the next search method
      NULL;
  END;
  
  -- If no direct match, return empty result
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Add the function to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE users;
