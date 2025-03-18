-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  progress INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
CREATE POLICY "Users can insert their own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;
CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- Milestone policies
DROP POLICY IF EXISTS "Users can view their own milestones" ON milestones;
CREATE POLICY "Users can view their own milestones"
  ON milestones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = milestones.goal_id
    AND goals.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert their own milestones" ON milestones;
CREATE POLICY "Users can insert their own milestones"
  ON milestones FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = milestones.goal_id
    AND goals.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update their own milestones" ON milestones;
CREATE POLICY "Users can update their own milestones"
  ON milestones FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = milestones.goal_id
    AND goals.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete their own milestones" ON milestones;
CREATE POLICY "Users can delete their own milestones"
  ON milestones FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM goals
    WHERE goals.id = milestones.goal_id
    AND goals.user_id = auth.uid()
  ));

-- Enable realtime
alter publication supabase_realtime add table goals;
alter publication supabase_realtime add table milestones;