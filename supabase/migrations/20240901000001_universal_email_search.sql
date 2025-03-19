-- Drop the existing function first to avoid return type errors
DROP FUNCTION IF EXISTS direct_email_search(text);

-- Create a simplified and more reliable search function
CREATE OR REPLACE FUNCTION direct_email_search(email_query TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  -- First try exact match
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.avatar_url
  FROM users u
  WHERE u.email = email_query;
  
  -- If no results, try case-insensitive match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u.avatar_url
    FROM users u
    WHERE LOWER(u.email) = LOWER(email_query);
  END IF;
  
  -- If still no results, try pattern match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u.avatar_url
    FROM users u
    WHERE u.email ILIKE '%' || email_query || '%';
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;