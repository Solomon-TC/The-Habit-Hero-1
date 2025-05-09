-- Insert initial achievements
INSERT INTO achievements (name, description, icon, badge_color, xp_reward, criteria, category)
VALUES
  ('First Habit', 'Create your first habit', 'award', '#FF5E5B', 50, '{"habits_created": 1}', 'habits'),
  ('Habit Master', 'Create 5 habits', 'award-star', '#8B5CF6', 100, '{"habits_created": 5}', 'habits'),
  ('Streak Starter', 'Complete a habit 3 days in a row', 'flame', '#3B82F6', 75, '{"streak": 3}', 'streaks'),
  ('Week Warrior', 'Complete a habit every day for a week', 'zap', '#10B981', 150, '{"streak": 7}', 'streaks'),
  ('Goal Getter', 'Complete your first goal', 'target', '#F59E0B', 100, '{"goals_completed": 1}', 'goals'),
  ('Social Butterfly', 'Add 3 friends', 'users', '#EC4899', 75, '{"friends_added": 3}', 'social');