-- Create a function to get user data by ID with proper name handling
CREATE OR REPLACE FUNCTION get_user_display_name(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    user_name TEXT;
    user_full_name TEXT;
    user_email TEXT;
    display_name TEXT;
BEGIN
    -- Get the user's data
    SELECT name, full_name, email INTO user_name, user_full_name, user_email
    FROM users
    WHERE id = user_id;
    
    -- Check if name is valid (not null, not empty, not a UUID)
    IF user_name IS NOT NULL AND user_name != '' AND user_name NOT LIKE '%-%-%-%-%' AND LENGTH(user_name) < 30 THEN
        display_name := user_name;
    -- Try full_name next
    ELSIF user_full_name IS NOT NULL AND user_full_name != '' THEN
        display_name := user_full_name;
    -- Try email username next
    ELSIF user_email IS NOT NULL AND user_email != '' AND position('@' in user_email) > 1 THEN
        display_name := split_part(user_email, '@', 1);
    -- Fallback to a generic name with the first 8 chars of the UUID
    ELSE
        display_name := 'User ' || SUBSTRING(user_id::text, 1, 8);
    END IF;
    
    RETURN display_name;
END;
$$;

-- Update the simple_user_search function to include display_name
CREATE OR REPLACE FUNCTION simple_user_search(search_query TEXT)
RETURNS SETOF users
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM users
    WHERE 
        name ILIKE '%' || search_query || '%' OR
        full_name ILIKE '%' || search_query || '%' OR
        email ILIKE '%' || search_query || '%'
    LIMIT 50;
END;
$$;
