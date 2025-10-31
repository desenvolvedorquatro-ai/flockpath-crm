-- Remover políticas RESTRICTIVE antigas da tabela profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles with region/area info" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Criar políticas PERMISSIVE (lógica OR) para profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Users can view profiles with region/area info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Garantir que a política de user_churches seja PERMISSIVE
DROP POLICY IF EXISTS "Admins can view all church assignments" ON public.user_churches;

CREATE POLICY "Admins can view all church assignments"
ON public.user_churches
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));