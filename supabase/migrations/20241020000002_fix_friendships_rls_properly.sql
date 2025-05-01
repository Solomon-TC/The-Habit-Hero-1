-- Drop any existing RLS policies on the friendships table
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can create their own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can manage their own friendships" ON friendships;

-- Disable RLS on the friendships table
ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;

-- Note: We're not trying to add the table to supabase_realtime since it's defined as FOR ALL TABLES