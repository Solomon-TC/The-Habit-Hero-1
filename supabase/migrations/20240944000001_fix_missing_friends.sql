-- Create a function to ensure friends are properly displayed
CREATE OR REPLACE FUNCTION ensure_friends_display()
RETURNS VOID AS $$
BEGIN
  -- Ensure all friend records have corresponding user records
  INSERT INTO public.users (id, email, name, token_identifier, created_at)
  SELECT DISTINCT f.friend_id, 'user_' || f.friend_id || '@example.com', 'User ' || substring(f.friend_id::text, 1, 8), f.friend_id, NOW()
  FROM public.friends f
  LEFT JOIN public.users u ON f.friend_id = u.id
  WHERE u.id IS NULL;
  
  -- Log the operation
  RAISE NOTICE 'Friends display fix applied';
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT ensure_friends_display();
