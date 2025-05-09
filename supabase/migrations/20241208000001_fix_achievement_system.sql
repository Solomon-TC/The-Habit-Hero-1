-- Fix achievement system to ensure achievements are properly awarded

-- Make sure the achievements table exists
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  badge_color TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  criteria JSONB,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Make sure the user_achievements table exists
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS on achievements table
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_achievements table
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policy for achievements table (read-only for all authenticated users)
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.achievements;
CREATE POLICY "Achievements are viewable by everyone" 
  ON public.achievements FOR SELECT 
  USING (true);

-- Create policy for user_achievements table (users can only see their own achievements)
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements" 
  ON public.user_achievements FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for user_achievements table (service role can insert achievements)
DROP POLICY IF EXISTS "Service role can insert achievements" ON public.user_achievements;
CREATE POLICY "Service role can insert achievements" 
  ON public.user_achievements FOR INSERT 
  WITH CHECK (true);

-- Create the First Step achievement if it doesn't exist
INSERT INTO public.achievements (id, name, description, badge_color, xp_reward, criteria, category)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'First Step',
  'Create your first habit',
  'green',
  50,
  '{"type": "total_habits", "threshold": 1}',
  'habits'
)
ON CONFLICT (id) DO NOTHING;

-- Create the Habit Streak achievement if it doesn't exist
INSERT INTO public.achievements (id, name, description, badge_color, xp_reward, criteria, category)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Consistency is Key',
  'Reach a 7-day streak on any habit',
  'blue',
  100,
  '{"type": "streak", "threshold": 7}',
  'streak'
)
ON CONFLICT (id) DO NOTHING;

-- Create the Early Bird achievement if it doesn't exist
INSERT INTO public.achievements (id, name, description, badge_color, xp_reward, criteria, category)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Early Bird',
  'Complete a habit before 8:00 AM',
  'yellow',
  50,
  '{"type": "early_completion", "specific_time": "08:00"}',
  'time'
)
ON CONFLICT (id) DO NOTHING;

-- Create the Level 5 achievement if it doesn't exist
INSERT INTO public.achievements (id, name, description, badge_color, xp_reward, criteria, category)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'Rising Star',
  'Reach level 5',
  'purple',
  200,
  '{"type": "level_reached", "threshold": 5}',
  'level'
)
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for achievements and user_achievements tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;
