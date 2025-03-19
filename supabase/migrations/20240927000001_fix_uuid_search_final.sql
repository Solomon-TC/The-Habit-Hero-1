-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS search_user_by_id(user_id_query TEXT);

-- Create an improved function for searching users by ID
CREATE OR REPLACE FUNCTION search_user_by_id(user_id_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- First try direct equality match (most efficient)
  RETURN QUERY
  SELECT * FROM users WHERE id::text = user_id_query;
  
  -- If no results, try case-insensitive exact match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM users WHERE LOWER(id::text) = LOWER(user_id_query);
  END IF;
  
  -- If still no results, try partial match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM users WHERE id::text ILIKE '%' || user_id_query || '%';
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Remove the ALTER PUBLICATION statement since users is already in the publication
