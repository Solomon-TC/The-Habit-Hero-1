-- Enable row level security for habit_logs table
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own habit logs
DROP POLICY IF EXISTS "Users can insert their own habit logs" ON habit_logs;
CREATE POLICY "Users can insert their own habit logs"
ON habit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to select their own habit logs
DROP POLICY IF EXISTS "Users can view their own habit logs" ON habit_logs;
CREATE POLICY "Users can view their own habit logs"
ON habit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
