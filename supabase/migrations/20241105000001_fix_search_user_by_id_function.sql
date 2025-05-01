-- Drop the existing function if it exists with all possible signatures
DROP FUNCTION IF EXISTS search_user_by_id(uuid);
DROP FUNCTION IF EXISTS search_user_by_id(text);

-- Create the function with proper type casting
CREATE OR REPLACE FUNCTION search_user_by_id(search_id uuid)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM users WHERE users.id::uuid = search_id::uuid;
END;
$$ LANGUAGE plpgsql;
