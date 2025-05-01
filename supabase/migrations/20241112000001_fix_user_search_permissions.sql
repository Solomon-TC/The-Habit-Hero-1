-- Ensure users table has proper permissions
-- First, check if RLS is enabled on the users table
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_enabled FROM pg_class WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  IF rls_enabled THEN
    -- If RLS is enabled, make sure we have proper policies
    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Allow public read access" ON public.users;
    
    -- Create a policy that allows anyone to read user data
    CREATE POLICY "Allow public read access"
      ON public.users
      FOR SELECT
      USING (true);
      
    RAISE NOTICE 'Created public read access policy for users table';
  ELSE
    -- If RLS is not enabled, we don't need to add policies
    RAISE NOTICE 'RLS is not enabled on users table, no policies needed';
  END IF;
END$$;

-- Ensure the search_user_by_id_text function has proper permissions
GRANT EXECUTE ON FUNCTION search_user_by_id_text(text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_by_id_text(text) TO anon;
GRANT EXECUTE ON FUNCTION search_user_by_id_text(text) TO service_role;

-- Make sure the users table is in the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
    RAISE NOTICE 'Added users table to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'Users table already in supabase_realtime publication';
  END IF;
END$$;
