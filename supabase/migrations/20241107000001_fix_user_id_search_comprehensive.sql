-- Fix the search_user_by_id function to properly handle UUID searches

-- Drop the existing function
DROP FUNCTION IF EXISTS search_user_by_id(search_id TEXT);

-- Create an improved version that handles UUID searches correctly
CREATE OR REPLACE FUNCTION search_user_by_id(search_id TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    level INTEGER,
    display_name TEXT
) AS $$
BEGIN
    -- First try to match against public.users table
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.full_name,
        u.email,
        u.avatar_url,
        COALESCE(u.level, 1) as level,
        COALESCE(u.display_name, 
            CASE
                WHEN u.name IS NOT NULL AND u.name != '' THEN u.name
                WHEN u.full_name IS NOT NULL AND u.full_name != '' THEN u.full_name
                WHEN u.email IS NOT NULL THEN split_part(u.email, '@', 1)
                ELSE 'User ' || SUBSTRING(u.id::text, 1, 8)
            END
        ) as display_name
    FROM 
        public.users u
    WHERE 
        u.id::text = search_id
    LIMIT 10;

    -- If we found results, return them
    IF FOUND THEN
        RETURN;
    END IF;

    -- If no results, try to match against auth.users directly
    RETURN QUERY
    SELECT 
        au.id,
        COALESCE(u.name, 'User ' || SUBSTRING(au.id::text, 1, 8)) as name,
        u.full_name,
        au.email,
        u.avatar_url,
        COALESCE(u.level, 1) as level,
        COALESCE(u.display_name, 
            CASE
                WHEN u.name IS NOT NULL AND u.name != '' THEN u.name
                WHEN u.full_name IS NOT NULL AND u.full_name != '' THEN u.full_name
                WHEN au.email IS NOT NULL THEN split_part(au.email, '@', 1)
                ELSE 'User ' || SUBSTRING(au.id::text, 1, 8)
            END
        ) as display_name
    FROM 
        auth.users au
    LEFT JOIN 
        public.users u ON au.id = u.id
    WHERE 
        au.id::text = search_id
    LIMIT 10;

END;
$$ LANGUAGE plpgsql;
