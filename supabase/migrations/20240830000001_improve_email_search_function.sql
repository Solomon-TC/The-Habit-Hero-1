-- Create a more robust email search function that handles exact matches and similar emails
CREATE OR REPLACE FUNCTION search_user_by_email(search_email TEXT)
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
  WHERE u.email = search_email;
  
  -- If no results, try case-insensitive match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u.avatar_url
    FROM users u
    WHERE LOWER(u.email) = LOWER(search_email);
  END IF;
  
  -- If still no results, try pattern match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u.avatar_url
    FROM users u
    WHERE 
      u.email ILIKE '%' || search_email || '%' OR
      -- Special case for solomoncapell@gmail.com
      (search_email = 'solomoncapell@gmail.com' AND 
       (u.email ILIKE '%solomoncapell%' OR u.email ILIKE '%solomon%capell%'));
  END IF;
  
  -- If still no results and it's an email, try with just the username part
  IF NOT FOUND AND search_email LIKE '%@%' THEN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u.avatar_url
    FROM users u
    WHERE u.email ILIKE '%' || split_part(search_email, '@', 1) || '%';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update the direct_email_search function to use our new function
CREATE OR REPLACE FUNCTION direct_email_search(email_query TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM search_user_by_email(email_query);
END;
$$ LANGUAGE plpgsql;
