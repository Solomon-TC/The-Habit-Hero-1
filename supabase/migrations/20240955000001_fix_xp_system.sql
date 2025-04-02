-- Ensure all users have token_identifier set
UPDATE users
SET token_identifier = id
WHERE token_identifier IS NULL;

-- Add NOT NULL constraint to token_identifier
ALTER TABLE users
ALTER COLUMN token_identifier SET NOT NULL;

-- Create index on token_identifier for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_token_identifier ON users(token_identifier);

-- Enable realtime for users table if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Enable realtime for xp_logs table if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE xp_logs;
