-- Comprehensive fix for the friend system

-- 1. First, ensure the users table has the correct structure
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 2. Update existing users to have proper display names
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

-- 3. Update users with UUID-like names
UPDATE public.users
SET 
  name = display_name
WHERE 
  name IS NULL 
  OR name = '' 
  OR name = id::text 
  OR name LIKE '%-%-%-%-%';

-- 4. Create a function to ensure all friend users exist with proper display names
CREATE OR REPLACE FUNCTION ensure_friend_users_exist()
RETURNS void AS $$
BEGIN
  -- Insert missing users from auth.users into public.users
  INSERT INTO public.users (id, email, name, full_name, display_name)
  SELECT 
    au.id, 
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'User ' || substring(au.id::text, 1, 8)) as name,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'User ' || substring(au.id::text, 1, 8)) as full_name,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'User ' || substring(au.id::text, 1, 8)) as display_name
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;

  -- Update users with UUID-like names to use email username or a generic name
  UPDATE public.users
  SET 
    name = CASE 
      WHEN email IS NOT NULL AND position('@' in email) > 1 
        THEN split_part(email, '@', 1)
      ELSE 'User ' || substring(id::text, 1, 8)
    END,
    display_name = CASE 
      WHEN email IS NOT NULL AND position('@' in email) > 1 
        THEN split_part(email, '@', 1)
      ELSE 'User ' || substring(id::text, 1, 8)
    END
  WHERE 
    name IS NULL 
    OR name = '' 
    OR name::text = id::text 
    OR name LIKE '%-%-%-%-%';

  -- Update users with NULL or empty full_name to match name
  UPDATE public.users
  SET full_name = name
  WHERE full_name IS NULL OR full_name = '';

  -- Ensure display_name is always populated
  UPDATE public.users
  SET display_name = CASE
    WHEN name IS NOT NULL AND name != '' AND name NOT LIKE '%-%-%-%-%' THEN name
    WHEN full_name IS NOT NULL AND full_name != '' THEN full_name
    WHEN email IS NOT NULL AND email != '' AND position('@' in email) > 1 THEN split_part(email, '@', 1)
    ELSE 'User ' || SUBSTRING(id::text, 1, 8)
  END
  WHERE display_name IS NULL OR display_name = '';
END;
$$ LANGUAGE plpgsql;

-- 5. Create a function to get a user's display name
CREATE OR REPLACE FUNCTION get_user_display_name(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    display_name TEXT;
BEGIN
    -- Get the user's display_name
    SELECT u.display_name INTO display_name
    FROM users u
    WHERE u.id = user_id;
    
    -- If no display_name found, create a generic one
    IF display_name IS NULL OR display_name = '' THEN
        display_name := 'User ' || SUBSTRING(user_id::text, 1, 8);
    END IF;
    
    RETURN display_name;
END;
$$;

-- 6. Run the function to fix existing data
SELECT ensure_friend_users_exist();

-- 7. Create a trigger to ensure display_name is always set
CREATE OR REPLACE FUNCTION ensure_display_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
        NEW.display_name := CASE
            WHEN NEW.name IS NOT NULL AND NEW.name != '' AND NEW.name NOT LIKE '%-%-%-%-%' THEN NEW.name
            WHEN NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN NEW.full_name
            WHEN NEW.email IS NOT NULL AND NEW.email != '' AND position('@' in NEW.email) > 1 THEN split_part(NEW.email, '@', 1)
            ELSE 'User ' || SUBSTRING(NEW.id::text, 1, 8)
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_display_name_trigger ON users;
CREATE TRIGGER ensure_display_name_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION ensure_display_name();
