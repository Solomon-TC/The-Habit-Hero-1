-- Comprehensive fix for friend name display issues

-- Update any users with null or empty names to use their full_name or email
UPDATE users
SET name = COALESCE(full_name, SPLIT_PART(email, '@', 1), 'Friend ' || SUBSTRING(id::text, 1, 8))
WHERE name IS NULL OR name = '' OR name = 'null' OR name = 'undefined';

-- Update any users with null or empty full_name to use their name or email
UPDATE users
SET full_name = COALESCE(name, SPLIT_PART(email, '@', 1), 'Friend ' || SUBSTRING(id::text, 1, 8))
WHERE full_name IS NULL OR full_name = '' OR full_name = 'null' OR full_name = 'undefined';

-- Create a function to ensure all users have valid names
CREATE OR REPLACE FUNCTION ensure_valid_user_names()
RETURNS TRIGGER AS $$
BEGIN
  -- If name is missing or invalid, set it from other fields
  IF NEW.name IS NULL OR NEW.name = '' OR NEW.name = 'null' OR NEW.name = 'undefined' THEN
    IF NEW.full_name IS NOT NULL AND NEW.full_name != '' AND NEW.full_name != 'null' AND NEW.full_name != 'undefined' THEN
      NEW.name := NEW.full_name;
    ELSIF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email != 'null' AND NEW.email != 'undefined' THEN
      NEW.name := SPLIT_PART(NEW.email, '@', 1);
    ELSE
      NEW.name := 'Friend ' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
  END IF;
  
  -- If full_name is missing or invalid, set it from other fields
  IF NEW.full_name IS NULL OR NEW.full_name = '' OR NEW.full_name = 'null' OR NEW.full_name = 'undefined' THEN
    IF NEW.name IS NOT NULL AND NEW.name != '' AND NEW.name != 'null' AND NEW.name != 'undefined' THEN
      NEW.full_name := NEW.name;
    ELSIF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email != 'null' AND NEW.email != 'undefined' THEN
      NEW.full_name := SPLIT_PART(NEW.email, '@', 1);
    ELSE
      NEW.full_name := 'Friend ' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS ensure_valid_user_names_trigger ON users;

-- Create the trigger
CREATE TRIGGER ensure_valid_user_names_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION ensure_valid_user_names();

-- Create a function to ensure friend users exist with proper names
CREATE OR REPLACE FUNCTION ensure_friend_user_exists(friend_id UUID)
RETURNS void AS $$
DECLARE
  user_exists BOOLEAN;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Check if user exists in public.users
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = friend_id) INTO user_exists;
  
  IF NOT user_exists THEN
    -- Try to get email and name from auth.users
    SELECT email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name')
    INTO user_email, user_name
    FROM auth.users
    WHERE id = friend_id;
    
    -- Insert the user with available data
    INSERT INTO public.users (id, email, name, full_name)
    VALUES (
      friend_id,
      COALESCE(user_email, ''),
      COALESCE(user_name, 'Friend ' || SUBSTRING(friend_id::text, 1, 8)),
      COALESCE(user_name, 'Friend ' || SUBSTRING(friend_id::text, 1, 8))
    );
  ELSE
    -- Update existing user if name is missing
    UPDATE public.users
    SET 
      name = COALESCE(name, full_name, 'Friend ' || SUBSTRING(id::text, 1, 8)),
      full_name = COALESCE(full_name, name, 'Friend ' || SUBSTRING(id::text, 1, 8))
    WHERE id = friend_id
    AND (name IS NULL OR name = '' OR name = 'null' OR name = 'undefined'
         OR full_name IS NULL OR full_name = '' OR full_name = 'null' OR full_name = 'undefined');
  END IF;
END;
$$ LANGUAGE plpgsql;
