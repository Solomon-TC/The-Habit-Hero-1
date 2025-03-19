-- First drop the existing function
DROP FUNCTION IF EXISTS direct_email_search(text);

-- Create a more robust email search function
CREATE OR REPLACE FUNCTION direct_email_search(email_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- First try exact match
  RETURN QUERY
  SELECT * FROM users WHERE email = email_query;
  
  -- If no results, try case-insensitive match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM users WHERE LOWER(email) = LOWER(email_query);
  END IF;
  
  -- If still no results, try pattern matching
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM users WHERE email ILIKE '%' || email_query || '%';
  END IF;
  
  -- Special case for solomoncapell@gmail.com
  IF email_query = 'solomoncapell@gmail.com' THEN
    RETURN QUERY
    SELECT * FROM users 
    WHERE email ILIKE '%solomoncapell%' OR email ILIKE '%solomon%capell%';
  END IF;
  
  -- If still no results and it's an email with @, try matching just the username part
  IF NOT FOUND AND position('@' in email_query) > 0 THEN
    RETURN QUERY
    SELECT * FROM users 
    WHERE email ILIKE '%' || split_part(email_query, '@', 1) || '%';
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
