-- Drop the function if it exists with any parameter name
DROP FUNCTION IF EXISTS public.search_users_by_email(text);
DROP FUNCTION IF EXISTS public.search_users_by_email(email_param text);
DROP FUNCTION IF EXISTS public.search_users_by_email(search_query text);

-- Create the function with the correct parameter name
CREATE OR REPLACE FUNCTION public.search_users_by_email(search_query text)
RETURNS TABLE (id uuid, name text, email text, avatar_url text) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.avatar_url
  FROM public.users u
  WHERE u.email ILIKE '%' || search_query || '%'
     OR u.email = search_query
     OR u.token_identifier ILIKE '%' || search_query || '%'
     OR u.token_identifier = search_query;
END;
$$ LANGUAGE plpgsql;
