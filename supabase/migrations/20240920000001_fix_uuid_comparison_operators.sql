-- Fix UUID comparison operators in search_user_by_id function
CREATE OR REPLACE FUNCTION search_user_by_id(user_id_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- First try exact match
  RETURN QUERY
  SELECT * FROM users
  WHERE id::text = user_id_query
  LIMIT 1;
  
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

-- Make sure the function is available for use
-- Note: We don't use ALTER PUBLICATION for functions
