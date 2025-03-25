-- Create a function to ensure all friend_ids have corresponding user records
CREATE OR REPLACE FUNCTION ensure_friend_users_exist()
RETURNS VOID AS $$
BEGIN
  -- Find friend_ids that don't have corresponding user records
  INSERT INTO public.users (id, email, name, token_identifier, created_at)
  SELECT DISTINCT f.friend_id, 
    'user_' || substring(f.friend_id::text, 1, 8) || '@example.com', 
    'User ' || substring(f.friend_id::text, 1, 8), 
    f.friend_id, 
    NOW()
  FROM public.friends f
  LEFT JOIN public.users u ON f.friend_id = u.id
  WHERE u.id IS NULL;

  -- Log the operation
  RAISE NOTICE 'Friend users created';
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT ensure_friend_users_exist();
