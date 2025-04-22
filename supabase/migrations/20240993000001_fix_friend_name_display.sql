-- Function to ensure friend names are properly displayed
CREATE OR REPLACE FUNCTION fix_uuid_names() RETURNS TRIGGER AS $$
BEGIN
  -- If the name is a UUID or contains hyphens, try to use a better name
  IF NEW.name IS NULL OR NEW.name = '' OR NEW.name = NEW.id OR NEW.name LIKE '%-%-%-%-%' THEN
    -- Try to use full_name if available
    IF NEW.full_name IS NOT NULL AND NEW.full_name != '' AND NEW.full_name != 'null' AND NEW.full_name != 'undefined' THEN
      NEW.name := NEW.full_name;
    -- Otherwise try to use email username
    ELSIF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email != 'null' AND NEW.email != 'undefined' THEN
      NEW.name := split_part(NEW.email, '@', 1);
    -- Last resort: use a friendly name with the first part of the UUID
    ELSE
      NEW.name := 'User ' || substring(NEW.id::text, 1, 8);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS fix_uuid_names_trigger ON users;

-- Create the trigger
CREATE TRIGGER fix_uuid_names_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fix_uuid_names();

-- Update existing users with UUID-like names
UPDATE users
SET name = 
  CASE 
    WHEN full_name IS NOT NULL AND full_name != '' AND full_name != 'null' AND full_name != 'undefined' 
      THEN full_name
    WHEN email IS NOT NULL AND email != '' AND email != 'null' AND email != 'undefined' 
      THEN split_part(email, '@', 1)
    ELSE 'User ' || substring(id::text, 1, 8)
  END
WHERE name IS NULL OR name = '' OR name = id OR name LIKE '%-%-%-%-%';

-- Enable realtime for users table
alter publication supabase_realtime add table users;
