-- ETAPA 1: Criar tabela user_group_access
CREATE TABLE IF NOT EXISTS public.user_group_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.assistance_groups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, group_id)
);

ALTER TABLE public.user_group_access ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_group_access_user ON public.user_group_access(user_id);
CREATE INDEX idx_user_group_access_group ON public.user_group_access(group_id);

COMMENT ON TABLE public.user_group_access IS 'Controla acesso específico de usuários a grupos de assistência';

-- Políticas RLS para user_group_access
CREATE POLICY "Admins can manage all group access"
ON public.user_group_access FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Pastors can manage group access for their churches"
ON public.user_group_access FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'pastor')
  AND group_id IN (
    SELECT ag.id FROM public.assistance_groups ag
    WHERE ag.church_id IN (SELECT church_id FROM public.get_user_church_ids(auth.uid()))
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'pastor')
  AND group_id IN (
    SELECT ag.id FROM public.assistance_groups ag
    WHERE ag.church_id IN (SELECT church_id FROM public.get_user_church_ids(auth.uid()))
  )
);

CREATE POLICY "Users can view their own group access"
ON public.user_group_access FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ETAPA 2: Criar função get_accessible_group_ids
CREATE OR REPLACE FUNCTION public.get_accessible_group_ids(_user_id uuid)
RETURNS TABLE (group_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.assistance_groups WHERE EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  )
  UNION
  SELECT id FROM public.assistance_groups WHERE EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'pastor_geral'
  )
  UNION
  SELECT ag.id FROM public.assistance_groups ag
  INNER JOIN public.churches c ON ag.church_id = c.id
  INNER JOIN public.profiles p ON p.id = _user_id
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'pastor_regiao'
  )
  AND c.region_id = p.region_id
  UNION
  SELECT ag.id FROM public.assistance_groups ag
  INNER JOIN public.churches c ON ag.church_id = c.id
  INNER JOIN public.profiles p ON p.id = _user_id
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'pastor_coordenador'
  )
  AND c.area_id = p.area_id
  UNION
  SELECT ag.id FROM public.assistance_groups ag
  INNER JOIN public.user_churches uc ON ag.church_id = uc.church_id
  WHERE uc.user_id = _user_id
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'pastor'
  )
  UNION
  SELECT ag.id FROM public.assistance_groups ag
  WHERE ag.responsible_id = _user_id
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'Diacono'
  )
  UNION
  SELECT group_id FROM public.user_group_access WHERE user_id = _user_id
$$;

-- ETAPA 3: Políticas RLS para assistance_groups
DROP POLICY IF EXISTS "Users can view accessible groups" ON public.assistance_groups;
DROP POLICY IF EXISTS "Admins and pastors can create groups" ON public.assistance_groups;
DROP POLICY IF EXISTS "Authorized users can update groups" ON public.assistance_groups;
DROP POLICY IF EXISTS "Admins and pastors can delete groups" ON public.assistance_groups;

CREATE POLICY "Users can view accessible groups"
ON public.assistance_groups FOR SELECT TO authenticated
USING (id IN (SELECT group_id FROM public.get_accessible_group_ids(auth.uid())));

CREATE POLICY "Admins and pastors can create groups"
ON public.assistance_groups FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'pastor')
  OR public.has_role(auth.uid(), 'pastor_geral')
  OR public.has_role(auth.uid(), 'pastor_regiao')
  OR public.has_role(auth.uid(), 'pastor_coordenador')
);

CREATE POLICY "Authorized users can update groups"
ON public.assistance_groups FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'pastor_geral')
  OR (
    (public.has_role(auth.uid(), 'pastor') OR 
     public.has_role(auth.uid(), 'pastor_regiao') OR 
     public.has_role(auth.uid(), 'pastor_coordenador'))
    AND id IN (SELECT group_id FROM public.get_accessible_group_ids(auth.uid()))
  )
  OR responsible_id = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'pastor_geral')
  OR (
    (public.has_role(auth.uid(), 'pastor') OR 
     public.has_role(auth.uid(), 'pastor_regiao') OR 
     public.has_role(auth.uid(), 'pastor_coordenador'))
    AND id IN (SELECT group_id FROM public.get_accessible_group_ids(auth.uid()))
  )
  OR responsible_id = auth.uid()
);

CREATE POLICY "Admins and pastors can delete groups"
ON public.assistance_groups FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    (public.has_role(auth.uid(), 'pastor') OR 
     public.has_role(auth.uid(), 'pastor_geral') OR
     public.has_role(auth.uid(), 'pastor_regiao') OR 
     public.has_role(auth.uid(), 'pastor_coordenador'))
    AND id IN (SELECT group_id FROM public.get_accessible_group_ids(auth.uid()))
  )
);

-- ETAPA 4: Criar função get_accessible_visitor_ids
CREATE OR REPLACE FUNCTION public.get_accessible_visitor_ids(_user_id uuid)
RETURNS TABLE (visitor_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.visitors WHERE EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  )
  UNION
  SELECT id FROM public.visitors WHERE EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'pastor_geral'
  )
  UNION
  SELECT v.id FROM public.visitors v
  INNER JOIN public.churches c ON v.church_id = c.id
  INNER JOIN public.profiles p ON p.id = _user_id
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'pastor_regiao'
  )
  AND c.region_id = p.region_id
  UNION
  SELECT v.id FROM public.visitors v
  INNER JOIN public.churches c ON v.church_id = c.id
  INNER JOIN public.profiles p ON p.id = _user_id
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'pastor_coordenador'
  )
  AND c.area_id = p.area_id
  UNION
  SELECT v.id FROM public.visitors v
  INNER JOIN public.user_churches uc ON v.church_id = uc.church_id
  WHERE uc.user_id = _user_id
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'pastor'
  )
  UNION
  SELECT v.id FROM public.visitors v
  INNER JOIN public.assistance_groups ag ON v.assistance_group_id = ag.id
  WHERE ag.responsible_id = _user_id
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'Diacono'
  )
  UNION
  SELECT v.id FROM public.visitors v
  WHERE v.assistance_group_id IN (
    SELECT group_id FROM public.user_group_access WHERE user_id = _user_id
  )
$$;

-- ETAPA 5: Políticas RLS para visitors
DROP POLICY IF EXISTS "Pastors can view their church visitors" ON public.visitors;
DROP POLICY IF EXISTS "Users can view visitors in their church" ON public.visitors;
DROP POLICY IF EXISTS "Group leaders can view their group visitors" ON public.visitors;
DROP POLICY IF EXISTS "Users can insert visitors in their church" ON public.visitors;
DROP POLICY IF EXISTS "Users can update visitors in their church" ON public.visitors;
DROP POLICY IF EXISTS "Users can delete visitors in their church" ON public.visitors;

CREATE POLICY "Users can view accessible visitors"
ON public.visitors FOR SELECT TO authenticated
USING (id IN (SELECT visitor_id FROM public.get_accessible_visitor_ids(auth.uid())));

CREATE POLICY "Authorized users can create visitors"
ON public.visitors FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'pastor_geral')
  OR (
    (public.has_role(auth.uid(), 'pastor') OR 
     public.has_role(auth.uid(), 'pastor_regiao') OR 
     public.has_role(auth.uid(), 'pastor_coordenador'))
    AND church_id IN (SELECT church_id FROM public.get_user_church_ids(auth.uid()))
  )
  OR (
    public.has_role(auth.uid(), 'Diacono')
    AND assistance_group_id IN (
      SELECT id FROM public.assistance_groups WHERE responsible_id = auth.uid()
    )
  )
  OR (
    assistance_group_id IN (
      SELECT group_id FROM public.user_group_access WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Authorized users can update visitors"
ON public.visitors FOR UPDATE TO authenticated
USING (id IN (SELECT visitor_id FROM public.get_accessible_visitor_ids(auth.uid())))
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'pastor_geral')
  OR (
    (public.has_role(auth.uid(), 'pastor') OR 
     public.has_role(auth.uid(), 'pastor_regiao') OR 
     public.has_role(auth.uid(), 'pastor_coordenador'))
    AND church_id IN (SELECT church_id FROM public.get_user_church_ids(auth.uid()))
  )
  OR (
    public.has_role(auth.uid(), 'Diacono')
    AND assistance_group_id IN (
      SELECT id FROM public.assistance_groups WHERE responsible_id = auth.uid()
    )
  )
  OR (
    assistance_group_id IN (
      SELECT group_id FROM public.user_group_access WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins and pastors can delete visitors"
ON public.visitors FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    (public.has_role(auth.uid(), 'pastor') OR 
     public.has_role(auth.uid(), 'pastor_geral') OR
     public.has_role(auth.uid(), 'pastor_regiao') OR 
     public.has_role(auth.uid(), 'pastor_coordenador'))
    AND id IN (SELECT visitor_id FROM public.get_accessible_visitor_ids(auth.uid()))
  )
);

-- ETAPA 6: Criar função get_accessible_attendance_ids
CREATE OR REPLACE FUNCTION public.get_accessible_attendance_ids(_user_id uuid)
RETURNS TABLE (attendance_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.attendance_records WHERE EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  )
  UNION
  SELECT id FROM public.attendance_records WHERE EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'pastor_geral'
  )
  UNION
  SELECT ar.id FROM public.attendance_records ar
  INNER JOIN public.churches c ON ar.church_id = c.id
  INNER JOIN public.profiles p ON p.id = _user_id
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'pastor_regiao'
  )
  AND c.region_id = p.region_id
  UNION
  SELECT ar.id FROM public.attendance_records ar
  INNER JOIN public.churches c ON ar.church_id = c.id
  INNER JOIN public.profiles p ON p.id = _user_id
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'pastor_coordenador'
  )
  AND c.area_id = p.area_id
  UNION
  SELECT ar.id FROM public.attendance_records ar
  INNER JOIN public.user_churches uc ON ar.church_id = uc.church_id
  WHERE uc.user_id = _user_id
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'pastor'
  )
  UNION
  SELECT ar.id FROM public.attendance_records ar
  INNER JOIN public.assistance_groups ag ON ar.assistance_group_id = ag.id
  WHERE ag.responsible_id = _user_id
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'Diacono'
  )
  UNION
  SELECT ar.id FROM public.attendance_records ar
  WHERE ar.assistance_group_id IN (
    SELECT group_id FROM public.user_group_access WHERE user_id = _user_id
  )
  UNION
  SELECT id FROM public.attendance_records WHERE recorded_by = _user_id
$$;

-- ETAPA 7: Políticas RLS para attendance_records
DROP POLICY IF EXISTS "Pastors can view their church attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Pastors can view all attendance in their churches" ON public.attendance_records;
DROP POLICY IF EXISTS "GA leaders can view attendance in their group" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "GA leaders can record attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "GA leaders can update attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "GA leaders can delete attendance records" ON public.attendance_records;

CREATE POLICY "Users can view accessible attendance"
ON public.attendance_records FOR SELECT TO authenticated
USING (id IN (SELECT attendance_id FROM public.get_accessible_attendance_ids(auth.uid())));

CREATE POLICY "Users can record attendance for accessible visitors"
ON public.attendance_records FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'pastor_geral')
  OR (
    (public.has_role(auth.uid(), 'pastor') OR 
     public.has_role(auth.uid(), 'pastor_regiao') OR 
     public.has_role(auth.uid(), 'pastor_coordenador'))
    AND church_id IN (SELECT church_id FROM public.get_user_church_ids(auth.uid()))
  )
  OR (
    public.has_role(auth.uid(), 'Diacono')
    AND assistance_group_id IN (
      SELECT id FROM public.assistance_groups WHERE responsible_id = auth.uid()
    )
  )
  OR (
    assistance_group_id IN (
      SELECT group_id FROM public.user_group_access WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Authorized users can update attendance"
ON public.attendance_records FOR UPDATE TO authenticated
USING (
  recorded_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'pastor_geral')
  OR (
    (public.has_role(auth.uid(), 'pastor') OR 
     public.has_role(auth.uid(), 'pastor_regiao') OR 
     public.has_role(auth.uid(), 'pastor_coordenador'))
    AND id IN (SELECT attendance_id FROM public.get_accessible_attendance_ids(auth.uid()))
  )
)
WITH CHECK (
  recorded_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'pastor_geral')
);

CREATE POLICY "Authorized users can delete attendance"
ON public.attendance_records FOR DELETE TO authenticated
USING (
  recorded_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (
    (public.has_role(auth.uid(), 'pastor') OR 
     public.has_role(auth.uid(), 'pastor_geral') OR
     public.has_role(auth.uid(), 'pastor_regiao') OR 
     public.has_role(auth.uid(), 'pastor_coordenador'))
    AND id IN (SELECT attendance_id FROM public.get_accessible_attendance_ids(auth.uid()))
  )
);

-- ETAPA 8: Migrar dados de profiles.church_id para user_churches
INSERT INTO public.user_churches (user_id, church_id)
SELECT id, church_id
FROM public.profiles
WHERE church_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_churches uc 
    WHERE uc.user_id = profiles.id 
      AND uc.church_id = profiles.church_id
  );