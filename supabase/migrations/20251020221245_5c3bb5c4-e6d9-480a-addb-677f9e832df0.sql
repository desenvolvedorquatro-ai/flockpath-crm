-- Criar função has_role se não existir (necessária para RLS policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ===== RLS Policies para role_permissions =====
-- Permitir admin fazer INSERT em permissões de funções
CREATE POLICY "Admins can insert role permissions"
ON public.role_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- Permitir admin fazer UPDATE em permissões de funções
CREATE POLICY "Admins can update role permissions"
ON public.role_permissions
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- Permitir admin fazer DELETE em permissões de funções
CREATE POLICY "Admins can delete role permissions"
ON public.role_permissions
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- ===== RLS Policies para visitor_interactions =====
-- Permitir admin fazer INSERT em interações de visitantes
CREATE POLICY "Admins can insert all interactions"
ON public.visitor_interactions
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- Permitir admin fazer UPDATE em interações de visitantes
CREATE POLICY "Admins can update all interactions"
ON public.visitor_interactions
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- Permitir admin fazer DELETE em interações de visitantes
CREATE POLICY "Admins can delete all interactions"
ON public.visitor_interactions
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);