-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_id TEXT,
  stripe_customer_id TEXT,
  price_id TEXT,
  stripe_price_id TEXT,
  currency TEXT,
  interval TEXT,
  status TEXT NOT NULL,
  amount INTEGER,
  cancel_at_period_end BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_start INTEGER,
  current_period_end INTEGER,
  ended_at INTEGER,
  cancel_at INTEGER,
  canceled_at INTEGER,
  started_at INTEGER,
  customer_id TEXT,
  metadata JSONB
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_id_idx ON subscriptions (stripe_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;
CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create webhook_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  type TEXT NOT NULL,
  stripe_event_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  modified_at TIMESTAMPTZ NOT NULL,
  data JSONB
);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE webhook_events;
