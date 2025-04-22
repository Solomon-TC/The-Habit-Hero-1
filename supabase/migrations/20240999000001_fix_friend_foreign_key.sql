-- Fix the foreign key constraint on the friends table

-- First, drop the existing constraint if it exists
ALTER TABLE public.friends DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;

-- Then add the constraint back, but referencing auth.users instead of public.users
ALTER TABLE public.friends ADD CONSTRAINT friends_friend_id_fkey
  FOREIGN KEY (friend_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure all friend users exist in public.users
INSERT INTO public.users (id, email, name, full_name, display_name)
SELECT 
  au.id, 
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'User ' || substring(au.id::text, 1, 8)) as name,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'User ' || substring(au.id::text, 1, 8)) as full_name,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'User ' || substring(au.id::text, 1, 8)) as display_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Run the ensure_friend_users_exist function
SELECT ensure_friend_users_exist();
