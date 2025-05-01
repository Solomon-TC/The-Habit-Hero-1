-- Drop the existing functions to avoid conflicts
DROP FUNCTION IF EXISTS search_user_by_id(uuid);
DROP FUNCTION IF EXISTS search_user_by_id(text);
DROP FUNCTION IF EXISTS search_user_by_id_text(text);

-- Create a new function with a distinct name for text-based search
CREATE OR REPLACE FUNCTION search_user_by_id_text(search_id TEXT)
RETURNS SETOF users AS $$
DECLARE
  user_record users%ROWTYPE;
BEGIN
  -- First try direct UUID match if the input is a valid UUID
  BEGIN
    SELECT * INTO user_record
    FROM users u
    WHERE u.id::text = search_id
    LIMIT 1;
    
    -- If we found a result, return it
    IF FOUND THEN
      RETURN NEXT user_record;
      RETURN;
    END IF;
  EXCEPTION
    WHEN others THEN
      -- If there's an error (like invalid UUID format), continue to the next search method
      NULL;
  END;
  
  -- If no direct match, try to find by email
  SELECT * INTO user_record
  FROM users u
  WHERE u.email = search_id
  LIMIT 1;
  
  -- If we found a result, return it
  IF FOUND THEN
    RETURN NEXT user_record;
    RETURN;
  END IF;
  
  -- If no matches found, return empty result
  RETURN;
END;
$$ LANGUAGE plpgsql;
