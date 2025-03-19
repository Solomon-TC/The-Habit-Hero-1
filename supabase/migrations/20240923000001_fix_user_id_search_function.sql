-- Fix the search_user_by_id function without adding users to publication
CREATE OR REPLACE FUNCTION search_user_by_id(user_id_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- Direct match
  RETURN QUERY SELECT * FROM users WHERE id::text = user_id_query;
  
  -- If no results from direct match, try partial text match
  IF NOT FOUND THEN
    RETURN QUERY SELECT * FROM users 
    WHERE id::text LIKE '%' || user_id_query || '%'
    LIMIT 5;
  END IF;
END;
$$ LANGUAGE plpgsql;
