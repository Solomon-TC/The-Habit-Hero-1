-- Improve the search_user_by_id function to better handle exact ID matches
CREATE OR REPLACE FUNCTION search_user_by_id(user_id_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- First try exact match after casting id to text
  RETURN QUERY
  SELECT *
  FROM users
  WHERE id::text = user_id_query
  LIMIT 1;
  
  -- If no results, try partial match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT *
    FROM users
    WHERE id::text ILIKE '%' || user_id_query || '%'
    LIMIT 5;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Make sure the function is accessible
GRANT EXECUTE ON FUNCTION search_user_by_id TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_by_id TO service_role;
