-- Drop existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS search_user_by_id(uuid);
DROP FUNCTION IF EXISTS search_user_by_id(text);

-- Create a new comprehensive function that handles both UUID and text formats
CREATE OR REPLACE FUNCTION search_user_by_id(user_id_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- First try direct UUID match if the input is a valid UUID
  RETURN QUERY 
  SELECT * FROM users 
  WHERE id::text = user_id_query
  LIMIT 5;
  
  -- If no results, try partial match
  IF NOT FOUND THEN
    RETURN QUERY 
    SELECT * FROM users 
    WHERE id::text ILIKE '%' || user_id_query || '%'
    LIMIT 5;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the function is accessible
GRANT EXECUTE ON FUNCTION search_user_by_id(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_by_id(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION search_user_by_id(TEXT) TO service_role;
