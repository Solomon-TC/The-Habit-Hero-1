-- Fix friend name display by ensuring all users have a name

-- Update any users with null names to have a default name
UPDATE users
SET name = 'Friend ' || substring(id::text, 1, 8)
WHERE name IS NULL OR name = '';

-- Add a trigger to ensure new users always have a name
CREATE OR REPLACE FUNCTION ensure_user_has_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS NULL OR NEW.name = '' THEN
    NEW.name := 'Friend ' || substring(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS ensure_user_has_name_trigger ON users;

-- Create the trigger
CREATE TRIGGER ensure_user_has_name_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION ensure_user_has_name();

-- Note: We don't need to add the users table to supabase_realtime
-- because the publication is already defined as FOR ALL TABLES
