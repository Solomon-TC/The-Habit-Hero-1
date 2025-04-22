-- Fix the friends query error by ensuring the function exists and works properly

-- First, ensure the display_name column exists
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update existing users to have proper display names
UPDATE public.users
SET 
  display_name = CASE
    -- Use name if it's valid (not a UUID)
    WHEN name IS NOT NULL AND name != '' AND name NOT LIKE '%-%-%-%-%' THEN name
    -- Use full_name if available
    WHEN full_name IS NOT NULL AND full_name != '' THEN full_name
    -- Use email username if available
    WHEN email IS NOT NULL AND email != '' AND position('@' in email) > 1 THEN split_part(email, '@', 1)
    -- Fallback to a generic name with the first 8 chars of the UUID
    ELSE 'User ' || SUBSTRING(id::text, 1, 8)
  END
WHERE display_name IS NULL OR display_name = '';

-- Create or replace the function to get friends with display names
CREATE OR REPLACE FUNCTION get_friends_with_display_names(user_id UUID)
RETURNS TABLE (
    friend_id UUID,
    name TEXT,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    level INTEGER,
    xp INTEGER,
    display_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.friend_id,
        COALESCE(u.name, 'User ' || SUBSTRING(f.friend_id::text, 1, 8)) as name,
        u.full_name,
        u.email,
        u.avatar_url,
        COALESCE(u.level, 1) as level,
        COALESCE(u.xp, 0) as xp,
        COALESCE(u.display_name, 'User ' || SUBSTRING(f.friend_id::text, 1, 8)) as display_name
    FROM 
        friends f
    LEFT JOIN 
        public.users u ON f.friend_id = u.id
    WHERE 
        f.user_id = get_friends_with_display_names.user_id;
END;
$$ LANGUAGE plpgsql;

-- Fix the foreign key constraint on the friends table
ALTER TABLE public.friends DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;
ALTER TABLE public.friends ADD CONSTRAINT friends_friend_id_fkey
  FOREIGN KEY (friend_id) REFERENCES auth.users(id) ON DELETE CASCADE;
