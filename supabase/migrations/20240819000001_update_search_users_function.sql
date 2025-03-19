-- Drop the existing function first to avoid parameter name change error
DROP FUNCTION IF EXISTS search_users_by_email(text);

-- Create a new function with the updated parameter name
CREATE OR REPLACE FUNCTION search_users_by_email(search_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM users
  WHERE 
    email = search_query OR 
    token_identifier = search_query OR
    email ILIKE '%' || search_query || '%' OR
    token_identifier ILIKE '%' || search_query || '%';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_users_by_email(text) TO authenticated;
