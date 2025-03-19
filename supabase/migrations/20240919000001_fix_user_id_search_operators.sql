-- Fix the search_user_by_id function to properly handle UUID comparisons
CREATE OR REPLACE FUNCTION search_user_by_id(user_id_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- First try direct exact match
  RETURN QUERY
  SELECT * FROM users
  WHERE id::text = user_id_query
  LIMIT 10;
  
  -- If no results, try case-insensitive partial match on the text representation
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM users
    WHERE id::text ILIKE '%' || user_id_query || '%'
    LIMIT 10;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
