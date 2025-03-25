-- Fix friends table creation and policies

-- First, ensure the friends table exists with proper structure
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, friend_id)
);

-- Enable RLS on the friends table
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can insert their own friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can delete their own friendships" ON public.friends;

-- Create new policies with proper conditions
CREATE POLICY "Users can view their own friendships"
  ON public.friends
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert their own friendships"
  ON public.friends
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own friendships"
  ON public.friends
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Removed the ALTER PUBLICATION line that was causing the error
-- The friends table is likely already part of the supabase_realtime publication