-- Fix the RLS policy for the friends table to ensure both users can see the friendship

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own friends" ON public.friends;
DROP POLICY IF EXISTS "Users can insert their own friends" ON public.friends;
DROP POLICY IF EXISTS "Users can delete their own friends" ON public.friends;

-- Create a new policy that allows users to see records where they are either user_id or friend_id
CREATE POLICY "Users can view their own friends"
  ON public.friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Allow users to insert their own friends
CREATE POLICY "Users can insert their own friends"
  ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own friends
CREATE POLICY "Users can delete their own friends"
  ON public.friends FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Make sure the friends table is in the realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add friends table to realtime publication: %', SQLERRM;
END $$;
