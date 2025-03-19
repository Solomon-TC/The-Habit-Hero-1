-- Drop the existing function
DROP FUNCTION IF EXISTS search_user_by_id(TEXT);

-- Create an improved function that prioritizes exact matches
CREATE OR REPLACE FUNCTION search_user_by_id(user_id_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- First try exact match
  RETURN QUERY
  SELECT u.*
  FROM users u
  WHERE u.id::text = user_id_query
  LIMIT 1;
  
  -- If no results, try partial match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT u.*
    FROM users u
    WHERE u.id::text ILIKE '%' || user_id_query || '%'
    LIMIT 5;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Make sure the function is accessible
GRANT EXECUTE ON FUNCTION search_user_by_id TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_by_id TO service_role;
