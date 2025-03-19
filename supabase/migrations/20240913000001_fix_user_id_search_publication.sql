-- Fix the user ID search function without adding to publication
-- since users is already a member of supabase_realtime

CREATE OR REPLACE FUNCTION search_user_by_id(search_id UUID)
RETURNS TABLE (id UUID, email TEXT, full_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.full_name
  FROM users u
  WHERE u.id = search_id;
END;
$$ LANGUAGE plpgsql;
