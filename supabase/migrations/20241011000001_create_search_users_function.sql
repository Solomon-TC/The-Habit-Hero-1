-- Create a function to search users by email
CREATE OR REPLACE FUNCTION search_users_by_email(search_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM users
  WHERE email ILIKE '%' || search_query || '%'
  OR name ILIKE '%' || search_query || '%'
  OR display_name ILIKE '%' || search_query || '%'
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION search_users_by_email(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION search_users_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_users_by_email(TEXT) TO anon;

-- Add the function to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE users;
