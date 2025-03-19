-- Drop the function if it exists
DROP FUNCTION IF EXISTS search_users_by_email(search_query TEXT);

-- Create the function with proper parameter handling
CREATE OR REPLACE FUNCTION search_users_by_email(search_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM users
  WHERE email ILIKE '%' || search_query || '%'
     OR token_identifier ILIKE '%' || search_query || '%';
END;
$$ LANGUAGE plpgsql;
