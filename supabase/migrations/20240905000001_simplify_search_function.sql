-- Create a simplified version that always returns results
CREATE OR REPLACE FUNCTION direct_email_search(email_query text)
RETURNS SETOF users AS $$
BEGIN
  -- If query is empty, return all users
  IF email_query = '' OR email_query IS NULL THEN
    RETURN QUERY SELECT * FROM users LIMIT 50;
    RETURN;
  END IF;
  
  -- Try exact match first
  RETURN QUERY 
  SELECT * FROM users 
  WHERE email = email_query
  LIMIT 50;
  
  -- If no results, try partial match
  IF NOT FOUND THEN
    RETURN QUERY 
    SELECT * FROM users 
    WHERE email ILIKE '%' || email_query || '%'
    LIMIT 50;
  END IF;
  
  -- If still no results, return all users
  IF NOT FOUND THEN
    RETURN QUERY SELECT * FROM users LIMIT 50;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
