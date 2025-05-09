-- Add the reason column to the xp_logs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'xp_logs' AND column_name = 'reason') THEN
        ALTER TABLE xp_logs ADD COLUMN reason TEXT;
    END IF;
END$$;

-- Update any existing NULL values to have a default reason
UPDATE xp_logs SET reason = 'general' WHERE reason IS NULL;
