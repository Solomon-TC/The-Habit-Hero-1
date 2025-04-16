-- Add avatar_url column to users table if it doesn't exist already
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'avatar_url') THEN
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    END IF;
END $$;

-- Enable storage for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow authenticated users to upload avatars
DROP POLICY IF EXISTS "Avatar storage policy" ON storage.objects;
CREATE POLICY "Avatar storage policy"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid() = owner OR bucket_id = 'avatars'))
WITH CHECK (bucket_id = 'avatars');

-- Set up storage policy to allow public read access to avatars
DROP POLICY IF EXISTS "Avatar public read policy" ON storage.objects;
CREATE POLICY "Avatar public read policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Note: We're removing the line that adds to realtime publication
-- because the publication is already defined as FOR ALL TABLES
-- and adding individual tables to it causes an error
