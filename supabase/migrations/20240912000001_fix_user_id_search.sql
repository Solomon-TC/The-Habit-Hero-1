-- Improve the search_user_by_id function to handle exact UUID matches better
CREATE OR REPLACE FUNCTION search_user_by_id(user_id_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- First try direct exact match with the ID
  RETURN QUERY
  SELECT * FROM users WHERE id::text = user_id_query;
  
  -- If no results, try case-insensitive match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM users WHERE LOWER(id::text) = LOWER(user_id_query);
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
