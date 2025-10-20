-- Corrigir função para incluir search_path
CREATE OR REPLACE FUNCTION get_user_last_sign_in(user_id uuid)
RETURNS timestamptz 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT last_sign_in_at FROM auth.users WHERE id = user_id;
$$;