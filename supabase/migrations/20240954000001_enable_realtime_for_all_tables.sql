-- Enable realtime for all relevant tables

-- Enable realtime for habits table
alter publication supabase_realtime add table habits;

-- Enable realtime for habit_logs table
alter publication supabase_realtime add table habit_logs;

-- Enable realtime for goals table
alter publication supabase_realtime add table goals;

-- Enable realtime for milestones table
alter publication supabase_realtime add table milestones;

-- Enable realtime for users table (for XP updates)
alter publication supabase_realtime add table users;

-- Enable realtime for xp_logs table
alter publication supabase_realtime add table xp_logs;
