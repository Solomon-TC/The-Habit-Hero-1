-- Create a function to ensure friend users exist and have proper names
CREATE OR REPLACE FUNCTION ensure_friend_users_exist()
RETURNS void AS $$
BEGIN
  -- Insert missing users from auth.users into public.users
  INSERT INTO public.users (id, email, name)
  SELECT 
    au.id, 
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as name
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;

  -- Update users with UUID-like names to use email username or a generic name
  UPDATE public.users
  SET name = 
    CASE 
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
END;
$$ LANGUAGE plpgsql;

-- Run the function to fix existing data
SELECT ensure_friend_users_exist();
