-- Drop the function if it exists
DROP FUNCTION IF EXISTS search_users_by_email(search_query TEXT);

-- Create the improved function with a simpler implementation
CREATE OR REPLACE FUNCTION search_users_by_email(search_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM users
  WHERE 
    email = search_query 
    OR email ILIKE '%' || search_query || '%'
    OR (position('@' in search_query) > 0 AND 
        email ILIKE '%' || split_part(search_query, '@', 1) || '%');
END;
$$ LANGUAGE plpgsql;
