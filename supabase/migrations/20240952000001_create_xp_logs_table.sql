-- Create XP logs table to track XP awards
CREATE TABLE IF NOT EXISTS xp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  level_before INTEGER NOT NULL,
  level_after INTEGER NOT NULL
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS xp_logs_user_id_idx ON xp_logs(user_id);

-- Enable realtime for XP logs
alter publication supabase_realtime add table xp_logs;
