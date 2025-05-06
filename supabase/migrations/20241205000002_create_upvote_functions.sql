-- Function to add an upvote and increment the upvote count atomically
CREATE OR REPLACE FUNCTION public.add_upvote(p_feedback_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the upvote record
  INSERT INTO public.feedback_upvotes (feedback_id, user_id)
  VALUES (p_feedback_id, p_user_id);
  
  -- Increment the upvote count
  UPDATE public.feedback
  SET upvotes = upvotes + 1
  WHERE id = p_feedback_id;
  
  -- Award XP to the feedback author (if XP system is enabled)
  -- This is optional and depends on your game mechanics
  -- PERFORM award_xp_with_transaction(
  --   (SELECT user_id FROM public.feedback WHERE id = p_feedback_id),
  --   1, -- Small XP amount for getting an upvote
  --   'feedback_upvote',
  --   p_feedback_id::text,
  --   (SELECT token_identifier FROM public.users WHERE id = (SELECT user_id FROM public.feedback WHERE id = p_feedback_id))
  -- );

EXCEPTION
  WHEN unique_violation THEN
    -- If the user has already upvoted, do nothing
    RAISE NOTICE 'User % has already upvoted feedback %', p_user_id, p_feedback_id;
  WHEN OTHERS THEN
    -- Re-raise the exception
    RAISE;
END;
$$;

-- Function to remove an upvote and decrement the upvote count atomically
CREATE OR REPLACE FUNCTION public.remove_upvote(p_feedback_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the upvote record
  DELETE FROM public.feedback_upvotes
  WHERE feedback_id = p_feedback_id AND user_id = p_user_id;
  
  -- Only decrement if a row was actually deleted
  IF FOUND THEN
    -- Decrement the upvote count
    UPDATE public.feedback
    SET upvotes = GREATEST(0, upvotes - 1) -- Ensure it doesn't go below 0
    WHERE id = p_feedback_id;
  END IF;
END;
$$;
