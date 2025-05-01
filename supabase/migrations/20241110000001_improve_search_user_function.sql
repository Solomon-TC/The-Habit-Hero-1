-- Drop the existing function to avoid conflicts
DROP FUNCTION IF EXISTS search_user_by_id_text(text);

-- Create an improved function for text-based user search
CREATE OR REPLACE FUNCTION search_user_by_id_text(search_id TEXT)
RETURNS SETOF users AS $$
DECLARE
  user_record users%ROWTYPE;
BEGIN
  -- First try direct UUID match if the input looks like a UUID
  IF search_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    -- Try to find by exact UUID match
    SELECT * INTO user_record
    FROM users u
    WHERE u.id::text = search_id
    LIMIT 1;
    
    -- If we found a result, return it
    IF FOUND THEN
      RETURN NEXT user_record;
      RETURN;
    END IF;
  END IF;
  
  -- If no direct UUID match or not a UUID format, try to find by email
  SELECT * INTO user_record
  FROM users u
  WHERE u.email = search_id
  LIMIT 1;
  
  -- If we found a result by email, return it
  IF FOUND THEN
    RETURN NEXT user_record;
    RETURN;
  END IF;
  
  -- If still no match, try partial UUID match (in case of copy/paste issues)
  IF length(search_id) >= 8 THEN
    SELECT * INTO user_record
    FROM users u
    WHERE u.id::text LIKE '%' || search_id || '%'
    LIMIT 1;
    
    -- If we found a result, return it
    IF FOUND THEN
      RETURN NEXT user_record;
      RETURN;
    END IF;
  END IF;
  
  -- If no matches found, return empty result
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for the users table if not already enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
END$$;
