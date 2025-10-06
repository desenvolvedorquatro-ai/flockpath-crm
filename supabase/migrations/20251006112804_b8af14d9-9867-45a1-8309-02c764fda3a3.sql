-- Criar tabela de permissões de igreja
CREATE TABLE IF NOT EXISTS public.church_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, church_id)
);

ALTER TABLE public.church_permissions ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário tem permissão para ver igreja
CREATE OR REPLACE FUNCTION public.can_view_church(_user_id UUID, _church_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = _user_id 
      AND role IN ('admin', 'pastor_geral')
    ) THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.church_permissions 
      WHERE user_id = _user_id 
      AND church_id = _church_id
    ) THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = _user_id 
      AND church_id = _church_id
    ) THEN true
    ELSE false
  END;
$$;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins podem gerenciar permissões" ON public.church_permissions;
DROP POLICY IF EXISTS "Pastores gerais podem gerenciar permissões" ON public.church_permissions;
DROP POLICY IF EXISTS "Users can view their own church" ON public.churches;
DROP POLICY IF EXISTS "Admins can view all churches" ON public.churches;
DROP POLICY IF EXISTS "Admins can insert churches" ON public.churches;
DROP POLICY IF EXISTS "Admins can update churches" ON public.churches;
DROP POLICY IF EXISTS "Admins can delete churches" ON public.churches;
DROP POLICY IF EXISTS "Users can view groups in their church" ON public.assistance_groups;
DROP POLICY IF EXISTS "Users can view groups in accessible churches" ON public.assistance_groups;
DROP POLICY IF EXISTS "Pastors can manage groups in their churches" ON public.assistance_groups;
DROP POLICY IF EXISTS "Users can view visitors in their church" ON public.visitors;
DROP POLICY IF EXISTS "Users can view visitors in accessible churches" ON public.visitors;
DROP POLICY IF EXISTS "Users can manage visitors in accessible churches" ON public.visitors;

-- Criar novas políticas para church_permissions
CREATE POLICY "Admins podem gerenciar permissões"
ON public.church_permissions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Pastores gerais podem gerenciar permissões"
ON public.church_permissions
FOR ALL
USING (public.has_role(auth.uid(), 'pastor_geral'));

-- Criar novas políticas para churches
CREATE POLICY "Users can view churches they have access to"
ON public.churches
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'pastor_geral')
  OR public.can_view_church(auth.uid(), id)
);

CREATE POLICY "Admins can insert churches"
ON public.churches
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor_geral'));

CREATE POLICY "Admins can update churches"
ON public.churches
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pastor_geral'));

CREATE POLICY "Admins can delete churches"
ON public.churches
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Criar novas políticas para assistance_groups
CREATE POLICY "Users can view groups in accessible churches"
ON public.assistance_groups
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'pastor_geral')
  OR public.can_view_church(auth.uid(), church_id)
);

CREATE POLICY "Pastors can manage groups in their churches"
ON public.assistance_groups
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'pastor_geral')
  OR (public.has_role(auth.uid(), 'pastor') AND public.can_view_church(auth.uid(), church_id))
);

-- Criar novas políticas para visitors
CREATE POLICY "Users can view visitors in accessible churches"
ON public.visitors
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'pastor_geral')
  OR public.can_view_church(auth.uid(), church_id)
);

CREATE POLICY "Users can manage visitors in accessible churches"
ON public.visitors
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'pastor_geral')
  OR public.can_view_church(auth.uid(), church_id)
);