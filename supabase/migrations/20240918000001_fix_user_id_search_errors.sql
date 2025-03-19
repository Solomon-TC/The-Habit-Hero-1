-- Fix the search_user_by_id function to handle UUID comparison properly
DROP FUNCTION IF EXISTS search_user_by_id;
CREATE OR REPLACE FUNCTION search_user_by_id(user_id_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- First try direct UUID match
  RETURN QUERY 
  SELECT * FROM users WHERE id::text = user_id_query;
  
  -- If no results, try partial match
  IF NOT FOUND THEN
    RETURN QUERY 
    SELECT * FROM users WHERE id::text ILIKE '%' || user_id_query || '%'
    LIMIT 5;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;