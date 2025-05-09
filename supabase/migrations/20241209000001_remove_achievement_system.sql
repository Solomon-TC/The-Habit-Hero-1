-- Drop user_achievements table
DROP TABLE IF EXISTS public.user_achievements;

-- Drop achievements table
DROP TABLE IF EXISTS public.achievements;

-- Drop any triggers related to achievements
DROP TRIGGER IF EXISTS habit_achievement_trigger ON habits;
DROP TRIGGER IF EXISTS streak_achievement_trigger ON habit_logs;

-- Drop any functions related to achievements
DROP FUNCTION IF EXISTS check_habit_achievements();
DROP FUNCTION IF EXISTS check_streak_achievements();
