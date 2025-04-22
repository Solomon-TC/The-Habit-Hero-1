-- Final comprehensive fix for the friend system

-- 1. First, ensure the users table has the correct structure
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 2. Fix the foreign key constraint on the friends table
ALTER TABLE public.friends DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;
ALTER TABLE public.friends ADD CONSTRAINT friends_friend_id_fkey
  FOREIGN KEY (friend_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Update existing users to have proper display names
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

-- 4. Create a function to ensure all friend users exist with proper display names
CREATE OR REPLACE FUNCTION ensure_friend_users_exist()
RETURNS void AS $$
DECLARE
  friend_record RECORD;
BEGIN
  -- First, find all friend_ids that don't have corresponding public.users records
  FOR friend_record IN 
    SELECT DISTINCT f.friend_id 
    FROM friends f
    LEFT JOIN public.users pu ON f.friend_id = pu.id
    WHERE pu.id IS NULL
  LOOP
    -- For each missing friend, try to get their data from auth.users
    INSERT INTO public.users (id, email, name, full_name, display_name)
    SELECT 
      au.id, 
      au.email,
      COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'User ' || substring(au.id::text, 1, 8)) as name,
      COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'User ' || substring(au.id::text, 1, 8)) as full_name,
      COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'User ' || substring(au.id::text, 1, 8)) as display_name
    FROM auth.users au
    WHERE au.id = friend_record.friend_id
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

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
    user_name TEXT;
    user_full_name TEXT;
    user_email TEXT;
    auth_email TEXT;
    auth_meta JSONB;
BEGIN
    -- First try to get from public.users
    SELECT u.display_name, u.name, u.full_name, u.email 
    INTO display_name, user_name, user_full_name, user_email
    FROM public.users u
    WHERE u.id = user_id;
    
    -- If no display_name found, try to get from auth.users
    IF display_name IS NULL OR display_name = '' THEN
        SELECT au.email, au.raw_user_meta_data 
        INTO auth_email, auth_meta
        FROM auth.users au
        WHERE au.id = user_id;
        
        -- Try to build a display name from auth data
        IF auth_meta IS NOT NULL THEN
            display_name := COALESCE(
                auth_meta->>'full_name',
                auth_meta->>'name',
                CASE WHEN auth_email IS NOT NULL AND position('@' in auth_email) > 1 
                    THEN split_part(auth_email, '@', 1) 
                    ELSE NULL 
                END,
                'User ' || SUBSTRING(user_id::text, 1, 8)
            );
        ELSIF auth_email IS NOT NULL AND position('@' in auth_email) > 1 THEN
            display_name := split_part(auth_email, '@', 1);
        ELSE
            display_name := 'User ' || SUBSTRING(user_id::text, 1, 8);
        END IF;
        
        -- Update the public.users table with this display name
        INSERT INTO public.users (id, email, name, full_name, display_name)
        VALUES (
            user_id, 
            auth_email, 
            display_name, 
            display_name, 
            display_name
        )
        ON CONFLICT (id) DO UPDATE SET 
            display_name = EXCLUDED.display_name,
            name = EXCLUDED.name,
            full_name = EXCLUDED.full_name;
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

-- 8. Create a function to directly get friend data with proper names
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
        COALESCE(u.name, get_user_display_name(f.friend_id)) as name,
        u.full_name,
        u.email,
        u.avatar_url,
        u.level,
        u.xp,
        COALESCE(u.display_name, get_user_display_name(f.friend_id)) as display_name
    FROM 
        friends f
    LEFT JOIN 
        public.users u ON f.friend_id = u.id
    WHERE 
        f.user_id = get_friends_with_display_names.user_id;
END;
$$ LANGUAGE plpgsql;
