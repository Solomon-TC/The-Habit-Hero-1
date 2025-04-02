-- Create a function to handle XP awards in a single transaction
CREATE OR REPLACE FUNCTION award_xp_with_transaction(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_source TEXT,
  p_source_id TEXT,
  p_token_identifier TEXT
) RETURNS TABLE (
  user_data JSONB,
  leveled_up BOOLEAN,
  level_before INTEGER,
  level_after INTEGER,
  new_xp INTEGER
) LANGUAGE plpgsql AS $$
DECLARE
  v_user_exists BOOLEAN;
  v_user_data JSONB;
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_leveled_up BOOLEAN;
  v_base_xp INTEGER := 100;
  v_growth_factor FLOAT := 1.5;
  v_total_xp_for_next_level INTEGER;
  v_level INTEGER;
BEGIN
  -- Start a transaction to ensure atomicity
  BEGIN
    -- Check if user exists
    SELECT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
      -- Create the user if they don't exist
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
      
      v_current_xp := 0;
      v_current_level := 1;
    ELSE
      -- Get existing user data
      SELECT 
        jsonb_build_object(
          'id', id,
          'xp', xp,
          'level', level,
          'token_identifier', token_identifier,
          'created_at', created_at,
          'updated_at', updated_at
        ),
        xp,
        level
      INTO v_user_data, v_current_xp, v_current_level
      FROM users
      WHERE id = p_user_id;
    END IF;
    
    -- Calculate new XP and level
    v_new_xp := v_current_xp + p_xp_amount;
    
    -- Calculate if this will cause a level up
    -- Calculate total XP needed for next level
    v_total_xp_for_next_level := 0;
    FOR i IN 1..(v_current_level) LOOP
      v_total_xp_for_next_level := v_total_xp_for_next_level + FLOOR(v_base_xp * POWER(v_growth_factor, i - 1));
    END LOOP;
    
    v_leveled_up := v_new_xp >= v_total_xp_for_next_level;
    
    -- Calculate the new level
    v_new_level := v_current_level;
    IF v_leveled_up THEN
      -- Find the appropriate level for the new XP amount
      v_level := v_current_level;
      WHILE TRUE LOOP
        -- Calculate total XP for next level
        v_total_xp_for_next_level := 0;
        FOR i IN 1..(v_level + 1) LOOP
          v_total_xp_for_next_level := v_total_xp_for_next_level + FLOOR(v_base_xp * POWER(v_growth_factor, i - 1));
        END LOOP;
        
        EXIT WHEN v_new_xp < v_total_xp_for_next_level;
        v_level := v_level + 1;
      END LOOP;
      v_new_level := v_level;
    END IF;
    
    -- Update the user's XP and level
    UPDATE users
    SET 
      xp = v_new_xp,
      level = v_new_level,
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
      v_current_level,
      v_new_level
    );
    
    -- Return the result
    RETURN QUERY SELECT 
      v_user_data,
      v_leveled_up,
      v_current_level,
      v_new_level,
      v_new_xp;
  END;
END;
$$;

-- Enable realtime for the users table if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Enable realtime for the xp_logs table if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE xp_logs;
