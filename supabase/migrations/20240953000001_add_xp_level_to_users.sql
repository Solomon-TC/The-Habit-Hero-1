-- Add xp and level columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
