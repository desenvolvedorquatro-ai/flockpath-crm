-- ETAPA 1: Criar função para verificar permissões baseadas no módulo de funções

-- Função para verificar se o usuário tem permissão no módulo visitantes
CREATE OR REPLACE FUNCTION public.can_manage_visitors(_user_id uuid, _action text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    INNER JOIN public.role_permissions rp ON ur.role = rp.role_name
    WHERE ur.user_id = _user_id 
    AND rp.module = 'visitantes'
    AND (
      (_action = 'create' AND rp.can_create = true) OR
      (_action = 'edit' AND rp.can_edit = true) OR
      (_action = 'delete' AND rp.can_delete = true) OR
      (_action = 'view' AND rp.can_view = true)
    )
  ) OR has_role(_user_id, 'admin');
$$;

-- Atualizar policy de INSERT para usar permissões granulares
DROP POLICY IF EXISTS "Authorized users can create visitors" ON public.visitors;
CREATE POLICY "Authorized users can create visitors v2"
ON public.visitors
FOR INSERT
TO authenticated
WITH CHECK (
  can_manage_visitors(auth.uid(), 'create') AND
  (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'pastor_geral') OR
    (church_id IN (SELECT church_id FROM get_user_church_ids(auth.uid()))) OR
    (has_role(auth.uid(), 'pastor_regiao') AND region_id IN (SELECT region_id FROM profiles WHERE id = auth.uid())) OR
    (has_role(auth.uid(), 'pastor_coordenador') AND area_id IN (SELECT area_id FROM profiles WHERE id = auth.uid())) OR
    (has_role(auth.uid(), 'Diacono') AND assistance_group_id IN (SELECT id FROM assistance_groups WHERE responsible_id = auth.uid())) OR
    (assistance_group_id IN (SELECT group_id FROM user_group_access WHERE user_id = auth.uid()))
  )
);

-- Atualizar policy de UPDATE para usar permissões granulares
DROP POLICY IF EXISTS "Authorized users can update visitors" ON public.visitors;
CREATE POLICY "Authorized users can update visitors v2"
ON public.visitors
FOR UPDATE
TO authenticated
USING (
  can_manage_visitors(auth.uid(), 'view') AND
  (id IN (SELECT visitor_id FROM get_accessible_visitor_ids(auth.uid())))
)
WITH CHECK (
  can_manage_visitors(auth.uid(), 'edit') AND
  (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'pastor_geral') OR
    (church_id IN (SELECT church_id FROM get_user_church_ids(auth.uid()))) OR
    (has_role(auth.uid(), 'pastor_regiao') AND region_id IN (SELECT region_id FROM profiles WHERE id = auth.uid())) OR
    (has_role(auth.uid(), 'pastor_coordenador') AND area_id IN (SELECT area_id FROM profiles WHERE id = auth.uid())) OR
    (has_role(auth.uid(), 'Diacono') AND assistance_group_id IN (SELECT id FROM assistance_groups WHERE responsible_id = auth.uid())) OR
    (assistance_group_id IN (SELECT group_id FROM user_group_access WHERE user_id = auth.uid()))
  )
);

-- Atualizar policy de DELETE para usar permissões granulares
DROP POLICY IF EXISTS "Admins and pastors can delete visitors" ON public.visitors;
CREATE POLICY "Admins and pastors can delete visitors v2"
ON public.visitors
FOR DELETE
TO authenticated
USING (
  can_manage_visitors(auth.uid(), 'delete') AND
  (
    has_role(auth.uid(), 'admin') OR 
    (
      (has_role(auth.uid(), 'pastor') OR has_role(auth.uid(), 'pastor_geral') OR has_role(auth.uid(), 'pastor_regiao') OR has_role(auth.uid(), 'pastor_coordenador')) 
      AND (id IN (SELECT visitor_id FROM get_accessible_visitor_ids(auth.uid())))
    )
  )
);