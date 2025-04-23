-- Create plans table for subscription options
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  interval TEXT NOT NULL,
  popular BOOLEAN DEFAULT false,
  features JSONB
);

-- Insert default plans
INSERT INTO plans (id, name, amount, interval, popular, features)
VALUES 
  ('price_basic', 'Basic', 0, 'month', false, '["Track up to 5 habits", "Basic statistics", "7-day streaks"]'::jsonb),
  ('price_premium', 'Premium', 999, 'month', true, '["Unlimited habits", "Advanced analytics", "Unlimited streaks", "Priority support"]'::jsonb),
  ('price_pro', 'Pro', 1999, 'month', false, '["Everything in Premium", "Team challenges", "API access", "Custom badges"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Enable row level security
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read plans
DROP POLICY IF EXISTS "Allow public read access to plans" ON plans;
CREATE POLICY "Allow public read access to plans"
  ON plans FOR SELECT
  USING (true);

-- Note: We don't need to explicitly add the table to supabase_realtime
-- as it's already defined as FOR ALL TABLES