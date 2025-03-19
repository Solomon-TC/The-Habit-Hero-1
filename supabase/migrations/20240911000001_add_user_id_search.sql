-- Create a function to search users by ID
CREATE OR REPLACE FUNCTION search_user_by_id(user_id_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- Try exact match on ID
  RETURN QUERY
  SELECT * FROM users WHERE id = user_id_query;
  
  -- If no results, return all users (limited to 50)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM users LIMIT 50;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
