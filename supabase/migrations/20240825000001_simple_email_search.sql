-- Create a very simple email search function to avoid timeout issues
CREATE OR REPLACE FUNCTION search_users_by_email(search_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM users
  WHERE email ILIKE '%' || search_query || '%';
END;
$$ LANGUAGE plpgsql;
