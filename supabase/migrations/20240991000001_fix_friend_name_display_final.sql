-- This migration ensures that friend names are properly displayed

-- Update any null or empty names in the users table
UPDATE users
SET name = full_name
WHERE (name IS NULL OR name = '' OR name = 'null' OR name = 'undefined') AND full_name IS NOT NULL AND full_name != '';

-- Create a function to ensure friend users exist with proper names
CREATE OR REPLACE FUNCTION ensure_friend_users_exist() RETURNS void AS $$
BEGIN
  -- Insert missing users from auth.users into public.users
  INSERT INTO public.users (id, email, name)
  SELECT au.id, au.email, COALESCE(au.raw_user_meta_data->>'full_name', au.email)
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;
  
  -- Update any users with missing names
  UPDATE public.users
  SET name = COALESCE(auth.users.raw_user_meta_data->>'full_name', auth.users.email)
  FROM auth.users
  WHERE public.users.id = auth.users.id
  AND (public.users.name IS NULL OR public.users.name = '' OR public.users.name = 'null' OR public.users.name = 'undefined');
  
  -- Ensure all friends have corresponding user entries
  INSERT INTO public.users (id, email, name)
  SELECT DISTINCT f.friend_id, NULL, 'Friend ' || substring(f.friend_id::text, 1, 8)
  FROM friends f
  LEFT JOIN public.users u ON f.friend_id = u.id
  WHERE u.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Run the function to fix existing data
SELECT ensure_friend_users_exist();
