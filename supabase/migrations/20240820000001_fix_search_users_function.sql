-- First drop the existing function
DROP FUNCTION IF EXISTS search_users_by_email(text);

-- Then recreate it with the updated parameter name and logic
CREATE OR REPLACE FUNCTION search_users_by_email(search_query text)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.avatar_url
  FROM users u
  WHERE 
    u.email ILIKE '%' || search_query || '%' 
    OR u.token_identifier ILIKE '%' || search_query || '%';
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for the function
alter publication supabase_realtime add table users;