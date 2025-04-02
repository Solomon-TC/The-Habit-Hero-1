-- Add xp_value column to milestones table
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS xp_value integer DEFAULT 20;
