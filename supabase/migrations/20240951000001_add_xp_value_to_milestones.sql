-- Add xp_value column to milestones table
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS xp_value integer DEFAULT 20;

-- Enable realtime for the milestones table
alter publication supabase_realtime add table milestones;
