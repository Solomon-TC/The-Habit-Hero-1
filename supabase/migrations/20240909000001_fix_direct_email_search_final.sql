-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS direct_email_search(email_query TEXT);

-- Create a new, simplified function that returns all users
CREATE OR REPLACE FUNCTION direct_email_search(email_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- First try exact match
  RETURN QUERY
  SELECT * FROM users WHERE email = email_query;
  
  -- If no results, try partial match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM users WHERE email ILIKE '%' || email_query || '%';
  END IF;
  
  -- If still no results, return all users (limited to 50)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM users LIMIT 50;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;