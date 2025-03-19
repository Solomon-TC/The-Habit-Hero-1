-- Remove the invalid publication statement from previous migration
-- Publications can only contain tables, not functions

-- Create or replace the search_user_by_id function with improved UUID handling
CREATE OR REPLACE FUNCTION search_user_by_id(user_id_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- First try direct UUID match
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
$$ LANGUAGE plpgsql;
