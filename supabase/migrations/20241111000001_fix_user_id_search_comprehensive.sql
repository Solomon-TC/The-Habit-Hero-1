-- Drop the existing function to avoid conflicts
DROP FUNCTION IF EXISTS search_user_by_id_text(text);

-- Create an improved function for text-based user search
CREATE OR REPLACE FUNCTION search_user_by_id_text(search_id TEXT)
RETURNS SETOF users AS $$
DECLARE
  user_record users%ROWTYPE;
  search_id_trimmed TEXT;
BEGIN
  -- Trim whitespace from the search input
  search_id_trimmed := TRIM(search_id);
  
  -- Log the search attempt for debugging
  RAISE NOTICE 'Searching for user with ID: %', search_id_trimmed;
  
  -- First try direct UUID match if the input looks like a UUID
  IF search_id_trimmed ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    -- Try to find by exact UUID match
    FOR user_record IN 
      SELECT * FROM users u WHERE u.id::text = search_id_trimmed
    LOOP
      RETURN NEXT user_record;
      RETURN; -- Exit after finding the first match
    END LOOP;
  END IF;
  
  -- If no direct UUID match or not a UUID format, try to find by email
  FOR user_record IN 
    SELECT * FROM users u WHERE LOWER(u.email) = LOWER(search_id_trimmed)
  LOOP
    RETURN NEXT user_record;
    RETURN; -- Exit after finding the first match
  END LOOP;
  
  -- Try with auth.users table as a fallback
  -- This is important because sometimes users might exist in auth.users but not in public.users
  DECLARE
    auth_user_id UUID;
    auth_user_email TEXT;
    auth_user_name TEXT;
  BEGIN
    SELECT id, email, raw_user_meta_data->>'name' 
    INTO auth_user_id, auth_user_email, auth_user_name
    FROM auth.users 
    WHERE id::text = search_id_trimmed OR email = search_id_trimmed
    LIMIT 1;
    
    IF FOUND THEN
      -- Create a synthetic user record from auth.users data
      user_record.id := auth_user_id;
      user_record.email := auth_user_email;
      user_record.name := auth_user_name;
      RETURN NEXT user_record;
      RETURN;
    END IF;
  END;
  
  -- If still no match, try partial UUID match (in case of copy/paste issues)
  IF length(search_id_trimmed) >= 4 THEN
    FOR user_record IN 
      SELECT * FROM users u WHERE u.id::text LIKE '%' || search_id_trimmed || '%'
      LIMIT 1
    LOOP
      RETURN NEXT user_record;
      RETURN; -- Exit after finding the first match
    END LOOP;
  END IF;
  
  -- If no matches found, return empty result
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Ensure the users table is in the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
END$$;
