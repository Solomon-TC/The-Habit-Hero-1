-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS search_user_by_id(uuid);

-- Create a function to search users by ID with explicit table references
CREATE OR REPLACE FUNCTION search_user_by_id(search_id UUID)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  SELECT users.*
  FROM users
  WHERE users.id = search_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION search_user_by_id(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION search_user_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_by_id(UUID) TO anon;
