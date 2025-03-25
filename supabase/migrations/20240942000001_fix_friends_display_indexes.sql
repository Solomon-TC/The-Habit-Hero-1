-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);

-- Update RLS policies to ensure proper access
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own friends" ON friends;
CREATE POLICY "Users can view their own friends"
    ON friends FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can insert their own friends" ON friends;
CREATE POLICY "Users can insert their own friends"
    ON friends FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own friends" ON friends;
CREATE POLICY "Users can delete their own friends"
    ON friends FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);
