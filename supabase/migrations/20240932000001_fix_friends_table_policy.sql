-- Fix the RLS policy for the friends table to allow users to see friends where they are either user_id or friend_id

-- Drop the existing policy that only allows users to see records where they are user_id
DROP POLICY IF EXISTS "Users can view their own friends" ON public.friends;

-- Create a new policy that allows users to see records where they are either user_id or friend_id
CREATE POLICY "Users can view their own friends"
  ON public.friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Make sure the friends table is in the realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
EXCEPTION WHEN OTHERS THEN
  -- If publication doesn't exist or other error, just log it and continue
  RAISE NOTICE 'Could not add friends table to realtime publication: %', SQLERRM;
END $$;
