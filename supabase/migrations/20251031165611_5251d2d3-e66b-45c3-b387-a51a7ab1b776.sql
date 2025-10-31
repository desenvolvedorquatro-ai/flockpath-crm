-- Passo 1: Corrigir a função get_user_church_ids para retornar TODAS as igrejas quando for admin
CREATE OR REPLACE FUNCTION public.get_user_church_ids(_user_id uuid)
RETURNS TABLE(church_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Se for admin, retorna todas as igrejas
  SELECT id as church_id 
  FROM public.churches
  WHERE public.has_role(_user_id, 'admin')
  
  UNION
  
  -- Retorna a igreja principal do perfil
  SELECT church_id 
  FROM public.profiles 
  WHERE id = _user_id 
  AND church_id IS NOT NULL
  
  UNION
  
  -- Retorna igrejas adicionais da tabela user_churches
  SELECT uc.church_id 
  FROM public.user_churches uc
  WHERE uc.user_id = _user_id
$$;

-- Passo 2: Corrigir a função can_manage_visitors para garantir que admins sempre tenham permissão
CREATE OR REPLACE FUNCTION public.can_manage_visitors(_user_id uuid, _action text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Admins sempre podem gerenciar
  SELECT public.has_role(_user_id, 'admin')
  OR
  -- Verifica permissões específicas na tabela role_permissions
  EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    INNER JOIN public.user_roles ur ON ur.role = rp.role_name
    WHERE ur.user_id = _user_id
    AND rp.module = 'visitantes'
    AND (
      (_action = 'view' AND rp.can_view = true) OR
      (_action = 'create' AND rp.can_create = true) OR
      (_action = 'edit' AND rp.can_edit = true) OR
      (_action = 'delete' AND rp.can_delete = true)
    )
  )
$$;

-- Passo 3: Garantir política explícita para admins em churches
DROP POLICY IF EXISTS "Admins can view all churches" ON public.churches;

CREATE POLICY "Admins can view all churches"
ON public.churches
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Passo 4: Garantir políticas PERMISSIVE para admins em user_churches (todas operações)
DROP POLICY IF EXISTS "Admins can view all church assignments" ON public.user_churches;
DROP POLICY IF EXISTS "Admins can delete church assignments" ON public.user_churches;
DROP POLICY IF EXISTS "Admins can insert church assignments" ON public.user_churches;
DROP POLICY IF EXISTS "Admins can update church assignments" ON public.user_churches;

CREATE POLICY "Admins can view all church assignments"
ON public.user_churches
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert church assignments"
ON public.user_churches
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update church assignments"
ON public.user_churches
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete church assignments"
ON public.user_churches
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));