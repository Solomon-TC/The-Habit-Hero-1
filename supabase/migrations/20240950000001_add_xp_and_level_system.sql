-- Add XP and level fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

-- Add XP values to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS xp_value INTEGER NOT NULL DEFAULT 10;

-- Add XP values to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS xp_value INTEGER NOT NULL DEFAULT 50;

-- Add XP values to milestones table
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS xp_value INTEGER NOT NULL DEFAULT 20;

-- Create function to calculate level based on XP
CREATE OR REPLACE FUNCTION calculate_level(xp_points INTEGER) RETURNS INTEGER AS $$
DECLARE
    level_threshold INTEGER := 100; -- Base XP needed for level 2
    growth_factor FLOAT := 1.5;     -- How much more XP is needed for each level
    current_level INTEGER := 1;
    current_threshold INTEGER := level_threshold;
BEGIN
    WHILE xp_points >= current_threshold LOOP
        current_level := current_level + 1;
        current_threshold := current_threshold + (level_threshold * POWER(growth_factor, current_level - 1)::INTEGER);
    END LOOP;
    
    RETURN current_level;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update level when XP changes
CREATE OR REPLACE FUNCTION update_user_level() RETURNS TRIGGER AS $$
BEGIN
    NEW.level := calculate_level(NEW.xp);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_level_trigger ON users;
CREATE TRIGGER update_user_level_trigger
BEFORE UPDATE OF xp ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_level();

-- Add publication for realtime updates
-- users table is already in the publication
