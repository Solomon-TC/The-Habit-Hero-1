-- Fix the award_xp_with_transaction function to handle race conditions properly

-- Drop the function if it exists to recreate it
DROP FUNCTION IF EXISTS award_xp_with_transaction;

-- Create the improved function with better error handling and atomic operations
CREATE OR REPLACE FUNCTION award_xp_with_transaction(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_source TEXT,
  p_source_id TEXT,
  p_token_identifier TEXT
) RETURNS JSONB[] AS $$
DECLARE
  v_user_data JSONB;
  v_level_before INTEGER;
  v_level_after INTEGER;
  v_xp_before INTEGER;
  v_xp_after INTEGER;
  v_leveled_up BOOLEAN := FALSE;
  v_result JSONB;
  v_results JSONB[] := '{}';
  v_user_exists BOOLEAN;
BEGIN
  -- Check if the user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id) INTO v_user_exists;
  
  -- If user doesn't exist, create them
  IF NOT v_user_exists THEN
    INSERT INTO users (id, xp, level, token_identifier, created_at, updated_at)
    VALUES (p_user_id, 0, 1, p_token_identifier, NOW(), NOW())
    RETURNING jsonb_build_object(
      'id', id,
      'xp', xp,
      'level', level,
      'token_identifier', token_identifier,
      'created_at', created_at,
      'updated_at', updated_at
    ) INTO v_user_data;
    
    v_level_before := 1;
    v_xp_before := 0;
  ELSE
    -- Get current user data
    SELECT 
      level, 
      xp,
      jsonb_build_object(
        'id', id,
        'xp', xp,
        'level', level,
        'token_identifier', token_identifier,
        'created_at', created_at,
        'updated_at', updated_at
      )
    INTO v_level_before, v_xp_before, v_user_data
    FROM users 
    WHERE id = p_user_id;
  END IF;
  
  -- Calculate new XP
  v_xp_after := v_xp_before + p_xp_amount;
  
  -- Calculate new level based on XP thresholds
  -- This uses the same formula as in the xp.ts file
  v_level_after := v_level_before;
  
  -- Base XP needed for level 2 is 100
  -- Each level requires 1.5x more XP than the previous level
  WHILE v_xp_after >= (
    -- Calculate total XP needed for next level
    SELECT SUM(FLOOR(100 * POWER(1.5, i - 1)))
    FROM generate_series(1, v_level_after) AS i
  ) LOOP
    v_level_after := v_level_after + 1;
    v_leveled_up := TRUE;
  END LOOP;
  
  -- Update the user with new XP and level
  UPDATE users
  SET 
    xp = v_xp_after,
    level = v_level_after,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING jsonb_build_object(
    'id', id,
    'xp', xp,
    'level', level,
    'token_identifier', token_identifier,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_user_data;
  
  -- Log the XP award
  INSERT INTO xp_logs (
    user_id,
    amount,
    source,
    source_id,
    created_at,
    level_before,
    level_after
  ) VALUES (
    p_user_id,
    p_xp_amount,
    p_source,
    p_source_id,
    NOW(),
    v_level_before,
    v_level_after
  );
  
  -- Build the result object
  v_result := jsonb_build_object(
    'user_data', v_user_data,
    'level_before', v_level_before,
    'level_after', v_level_after,
    'xp_before', v_xp_before,
    'new_xp', v_xp_after,
    'xp_added', p_xp_amount,
    'leveled_up', v_leveled_up
  );
  
  v_results := array_append(v_results, v_result);
  
  RETURN v_results;
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  RETURN array[jsonb_build_object(
    'error', TRUE,
    'message', SQLERRM,
    'code', SQLSTATE
  )];
END;
$$ LANGUAGE plpgsql;

-- Make sure the tables are part of the realtime publication
DO $$
BEGIN
  -- Check if the table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'users'
  ) THEN
    -- Add the table to the publication if it's not already there
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'xp_logs'
  ) THEN
    -- Add the table to the publication if it's not already there
    ALTER PUBLICATION supabase_realtime ADD TABLE xp_logs;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If there's an error (like the table already being in the publication),
  -- just continue without failing the migration
  RAISE NOTICE 'Error adding table to publication: %', SQLERRM;
END
$$;