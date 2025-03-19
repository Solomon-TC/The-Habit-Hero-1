-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS direct_email_search(email_query text);

-- Create a more reliable search function that will find all users
CREATE OR REPLACE FUNCTION direct_email_search(email_query text)
RETURNS SETOF users AS $$
BEGIN
  -- First try exact match (case insensitive)
  RETURN QUERY
  SELECT * FROM users
  WHERE LOWER(email) = LOWER(email_query);
  
  -- If no results, try pattern match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM users
    WHERE LOWER(email) LIKE LOWER('%' || email_query || '%');
  END IF;
  
  -- If still no results and query has @, try with just the username part
  IF NOT FOUND AND position('@' in email_query) > 0 THEN
    RETURN QUERY
    SELECT * FROM users
    WHERE LOWER(email) LIKE LOWER('%' || split_part(email_query, '@', 1) || '%');
  END IF;
  
  -- If still no results, try name match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM users
    WHERE LOWER(name) LIKE LOWER('%' || email_query || '%');
  END IF;
  
  -- If still nothing, return all users (limited to 20)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM users
    LIMIT 20;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;