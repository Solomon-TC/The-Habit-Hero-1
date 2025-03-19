-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS direct_email_search(email_query text);

-- Create a simplified version that will return results
CREATE OR REPLACE FUNCTION direct_email_search(email_query text)
RETURNS SETOF users AS $$
DECLARE
  query_text text := LOWER(TRIM(email_query));
  results users[];
BEGIN
  -- If query is empty, return all users (limited to 20)
  IF query_text = '' THEN
    RETURN QUERY SELECT * FROM users LIMIT 20;
    RETURN;
  END IF;

  -- Try exact match first
  RETURN QUERY 
  SELECT * FROM users 
  WHERE LOWER(email) = query_text
  LIMIT 20;
  
  -- If no results, try LIKE match
  IF NOT FOUND THEN
    RETURN QUERY 
    SELECT * FROM users 
    WHERE LOWER(email) LIKE '%' || query_text || '%'
    LIMIT 20;
  END IF;
  
  -- If still no results, return all users
  IF NOT FOUND THEN
    RETURN QUERY SELECT * FROM users LIMIT 20;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
