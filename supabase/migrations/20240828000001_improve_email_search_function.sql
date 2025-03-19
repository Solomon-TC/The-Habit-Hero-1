-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS direct_email_search(text);

-- Create an improved function to directly search for emails using SQL
CREATE OR REPLACE FUNCTION direct_email_search(email_query TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.avatar_url::TEXT
  FROM users u
  WHERE 
    u.email IS NOT NULL AND (
      u.email = email_query OR 
      LOWER(u.email) = LOWER(email_query) OR
      u.email ILIKE '%' || email_query || '%' OR
      u.email ILIKE '%' || split_part(email_query, '@', 1) || '%' OR
      -- Add more flexible matching for similar emails
      levenshtein(LOWER(u.email), LOWER(email_query)) <= 3 OR
      -- Match emails with similar usernames but different domains
      split_part(LOWER(u.email), '@', 1) = split_part(LOWER(email_query), '@', 1)
    );
END;
$$ LANGUAGE plpgsql;

-- Add the function to the realtime publication
COMMENT ON FUNCTION direct_email_search IS 'Function to directly search for emails with improved matching including similar emails';
