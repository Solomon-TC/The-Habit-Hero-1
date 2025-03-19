-- Create a function to directly search for emails using SQL
CREATE OR REPLACE FUNCTION direct_email_search(email_query TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.avatar_url
  FROM users u
  WHERE u.email = email_query
  OR u.email ILIKE '%' || email_query || '%';
END;
$$ LANGUAGE plpgsql;

-- Add the function to the realtime publication
COMMENT ON FUNCTION direct_email_search IS 'Function to directly search for emails using SQL';
