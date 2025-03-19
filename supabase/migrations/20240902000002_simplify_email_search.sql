-- Drop the existing function first
DROP FUNCTION IF EXISTS direct_email_search(email_query TEXT);

-- Create a simplified and more reliable email search function
CREATE OR REPLACE FUNCTION direct_email_search(email_query TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  -- First try exact match (case insensitive)
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.avatar_url
  FROM users u
  WHERE LOWER(u.email) = LOWER(email_query);
  
  -- If no results, try pattern matching
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u.avatar_url
    FROM users u
    WHERE u.email ILIKE '%' || email_query || '%';
  END IF;
  
  -- If still no results and query contains @, try matching just the username part
  IF NOT FOUND AND position('@' in email_query) > 0 THEN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u.avatar_url
    FROM users u
    WHERE u.email ILIKE '%' || split_part(email_query, '@', 1) || '%';
  END IF;
END;
$$ LANGUAGE plpgsql;
