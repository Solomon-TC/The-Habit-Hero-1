-- Fix the search_user_by_id function to better handle UUID formats
CREATE OR REPLACE FUNCTION search_user_by_id(user_id_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- First try exact match
  RETURN QUERY
  SELECT * FROM users WHERE id = user_id_query;
  
  -- If no results, try partial match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM users WHERE id ILIKE '%' || user_id_query || '%'
    LIMIT 10;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
