-- Ensure the friends table exists with the correct structure
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Ensure RLS is enabled for the friends table
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own friends" ON public.friends;

-- Create a new policy that allows users to see records where they are either user_id or friend_id
CREATE POLICY "Users can view their own friends"
  ON public.friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Allow users to insert their own friends
DROP POLICY IF EXISTS "Users can insert their own friends" ON public.friends;
CREATE POLICY "Users can insert their own friends"
  ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own friends
DROP POLICY IF EXISTS "Users can delete their own friends" ON public.friends;
CREATE POLICY "Users can delete their own friends"
  ON public.friends FOR DELETE
  USING (auth.uid() = user_id);

-- Make sure the friends table is in the realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
EXCEPTION WHEN OTHERS THEN
  -- If publication doesn't exist or other error, just log it and continue
  RAISE NOTICE 'Could not add friends table to realtime publication: %', SQLERRM;
END $$;
