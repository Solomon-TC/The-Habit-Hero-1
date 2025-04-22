-- Final fix for display names

-- Update all users to have proper display names
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
WHERE display_name IS NULL OR display_name = '' OR display_name = id::text OR (display_name IS NOT NULL AND id IS NOT NULL AND display_name::text = id::text);