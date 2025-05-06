-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  feedback_type TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback_upvotes table to track who upvoted what
CREATE TABLE IF NOT EXISTS public.feedback_upvotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feedback_id, user_id)
);

-- Add RLS policies
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_upvotes ENABLE ROW LEVEL SECURITY;

-- Everyone can read feedback
DROP POLICY IF EXISTS "Anyone can read feedback" ON public.feedback;
CREATE POLICY "Anyone can read feedback"
  ON public.feedback FOR SELECT
  USING (true);

-- Only the author can update their feedback
DROP POLICY IF EXISTS "Users can update own feedback" ON public.feedback;
CREATE POLICY "Users can update own feedback"
  ON public.feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- Only the author can delete their feedback
DROP POLICY IF EXISTS "Users can delete own feedback" ON public.feedback;
CREATE POLICY "Users can delete own feedback"
  ON public.feedback FOR DELETE
  USING (auth.uid() = user_id);

-- Only authenticated users can insert feedback
DROP POLICY IF EXISTS "Authenticated users can insert feedback" ON public.feedback;
CREATE POLICY "Authenticated users can insert feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Everyone can read upvotes
DROP POLICY IF EXISTS "Anyone can read feedback upvotes" ON public.feedback_upvotes;
CREATE POLICY "Anyone can read feedback upvotes"
  ON public.feedback_upvotes FOR SELECT
  USING (true);

-- Only the upvoter can delete their upvote
DROP POLICY IF EXISTS "Users can delete own upvotes" ON public.feedback_upvotes;
CREATE POLICY "Users can delete own upvotes"
  ON public.feedback_upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- Only authenticated users can insert upvotes
DROP POLICY IF EXISTS "Authenticated users can insert upvotes" ON public.feedback_upvotes;
CREATE POLICY "Authenticated users can insert upvotes"
  ON public.feedback_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: Removed alter publication statements as they're not needed
-- The publication is already defined as FOR ALL TABLES
