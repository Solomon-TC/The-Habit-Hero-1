-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS direct_email_search(text);

-- Create a simplified version that always returns results
CREATE OR REPLACE FUNCTION direct_email_search(email_query text)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  -- Try exact match first
  RETURN QUERY 
  SELECT u.id, u.name, u.email, u.avatar_url FROM users u
  WHERE u.email = email_query
  LIMIT 50;
  
  -- If no results, try partial match
  IF NOT FOUND THEN
    RETURN QUERY 
    SELECT u.id, u.name, u.email, u.avatar_url FROM users u
    WHERE u.email ILIKE '%' || email_query || '%'
    LIMIT 50;
  END IF;
  
  -- If still no results, return all users
  IF NOT FOUND THEN
    RETURN QUERY 
    SELECT u.id, u.name, u.email, u.avatar_url FROM users u
    LIMIT 50;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
