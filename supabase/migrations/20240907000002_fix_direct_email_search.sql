-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS direct_email_search(email_query TEXT);

-- Create a simplified version of the function
CREATE OR REPLACE FUNCTION direct_email_search(email_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  -- Return users where email contains the query (case insensitive)
  RETURN QUERY
  SELECT *
  FROM users
  WHERE email ILIKE '%' || email_query || '%'
  ORDER BY created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for the users table
ALTER PUBLICATION supabase_realtime ADD TABLE users;
