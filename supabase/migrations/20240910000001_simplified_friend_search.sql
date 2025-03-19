-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS direct_email_search;

-- Create a simplified search function that focuses on reliability
CREATE OR REPLACE FUNCTION simple_user_search(search_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- If query is empty, return all users
  IF search_query IS NULL OR search_query = '' THEN
    RETURN QUERY SELECT * FROM users LIMIT 50;
  ELSE
    -- First try exact email match
    RETURN QUERY 
      SELECT * FROM users 
      WHERE email = search_query
      LIMIT 50;
    
    -- If no results, try partial email match
    IF NOT FOUND THEN
      RETURN QUERY 
        SELECT * FROM users 
        WHERE email ILIKE '%' || search_query || '%'
        LIMIT 50;
    END IF;
    
    -- If still no results, try name match
    IF NOT FOUND THEN
      RETURN QUERY 
        SELECT * FROM users 
        WHERE name ILIKE '%' || search_query || '%'
        LIMIT 50;
    END IF;
  END IF;
  
  -- If nothing found, return empty set
  RETURN;
END;
$$ LANGUAGE plpgsql;
