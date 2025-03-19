-- Create a function to search users by email using raw SQL
-- This provides a fallback method if the regular queries aren't working

CREATE OR REPLACE FUNCTION search_users_by_email(email_param TEXT)
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.users
  WHERE email ILIKE '%' || email_param || '%'
  LIMIT 10;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_users_by_email TO authenticated;
