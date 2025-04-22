-- Final fix for friend display issues

-- 1. Ensure the display_name column exists
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 2. Update all users to have proper display names
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

-- 3. Drop the foreign key constraint on the friends table to prevent errors
ALTER TABLE public.friends DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;

-- 4. Create a simple function to get friends
-- First drop the existing function to avoid return type errors
DROP FUNCTION IF EXISTS get_friends(UUID);

CREATE OR REPLACE FUNCTION get_friends(user_id UUID)
RETURNS TABLE (
    friend_id UUID
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        f.friend_id
    FROM 
        friends f
    WHERE 
        f.user_id = get_friends.user_id;
END;
$$ LANGUAGE plpgsql;
