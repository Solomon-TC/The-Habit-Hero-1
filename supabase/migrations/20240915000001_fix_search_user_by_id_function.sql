-- Fix the search_user_by_id function to properly handle UUID comparisons
CREATE OR REPLACE FUNCTION search_user_by_id(user_id_query TEXT)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  SELECT u.*
  FROM users u
  WHERE u.id::text ILIKE '%' || user_id_query || '%'
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;
