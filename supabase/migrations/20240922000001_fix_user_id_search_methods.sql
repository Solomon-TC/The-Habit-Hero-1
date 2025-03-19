-- Fix the partialMatch operator issue
CREATE OR REPLACE FUNCTION search_user_by_id(search_id UUID)
RETURNS TABLE (id UUID, email TEXT, created_at TIMESTAMPTZ) AS $$
BEGIN
  -- Direct match
  RETURN QUERY SELECT users.id, users.email, users.created_at FROM users WHERE users.id = search_id;
  
  -- If no results from direct match, try text match
  IF NOT FOUND THEN
    RETURN QUERY SELECT users.id, users.email, users.created_at FROM users 
    WHERE users.id::text LIKE search_id::text;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Ensure the function is available in realtime
ALTER PUBLICATION supabase_realtime ADD TABLE users;
