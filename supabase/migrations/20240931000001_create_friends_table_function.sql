-- Function to create friends table if it doesn't exist
CREATE OR REPLACE FUNCTION create_friends_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if the friends table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'friends') THEN
    -- Create the friends table
    CREATE TABLE public.friends (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      UNIQUE(user_id, friend_id)
    );

    -- Add table to realtime publication
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
    EXCEPTION WHEN OTHERS THEN
      -- If publication doesn't exist or other error, just log it and continue
      RAISE NOTICE 'Could not add friends table to realtime publication: %', SQLERRM;
    END;

    -- Set up RLS policies
    ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

    -- Allow users to see their own friends
    DROP POLICY IF EXISTS "Users can view their own friends" ON public.friends;
    CREATE POLICY "Users can view their own friends"
      ON public.friends FOR SELECT
      USING (auth.uid() = user_id);

    -- Allow users to manage their own friends
    DROP POLICY IF EXISTS "Users can manage their own friends" ON public.friends;
    CREATE POLICY "Users can manage their own friends"
      ON public.friends FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_friends_table_if_not_exists();
