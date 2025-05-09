-- Ensure the xp_logs table exists
CREATE TABLE IF NOT EXISTS public.xp_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    source_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT positive_xp CHECK (amount > 0)
);

-- Add RLS policies for xp_logs
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own XP logs
DROP POLICY IF EXISTS "Users can view their own XP logs" ON public.xp_logs;
CREATE POLICY "Users can view their own XP logs"
    ON public.xp_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Only the service role can insert XP logs
DROP POLICY IF EXISTS "Service role can insert XP logs" ON public.xp_logs;
CREATE POLICY "Service role can insert XP logs"
    ON public.xp_logs FOR INSERT
    WITH CHECK (true);

-- Ensure users table has xp and level columns
DO 11669 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'xp') THEN
        ALTER TABLE public.users ADD COLUMN xp INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'level') THEN
        ALTER TABLE public.users ADD COLUMN level INTEGER DEFAULT 1;
    END IF;
END 11669;

-- Enable realtime for xp_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.xp_logs;
