-- 1. Adicionar novas colunas temporárias do tipo text
ALTER TABLE public.user_roles ADD COLUMN role_temp text;
ALTER TABLE public.role_permissions ADD COLUMN role_name_temp text;

-- 2. Copiar os dados para as novas colunas
UPDATE public.user_roles SET role_temp = role::text;
UPDATE public.role_permissions SET role_name_temp = role_name::text;

-- 3. Tornar as novas colunas NOT NULL
ALTER TABLE public.user_roles ALTER COLUMN role_temp SET NOT NULL;
ALTER TABLE public.role_permissions ALTER COLUMN role_name_temp SET NOT NULL;

-- 4. Dropar policies de user_roles explicitamente
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- 5. Dropar as colunas antigas COM CASCADE
ALTER TABLE public.user_roles DROP COLUMN role CASCADE;
ALTER TABLE public.role_permissions DROP COLUMN role_name CASCADE;

-- 6. Renomear as colunas temporárias
ALTER TABLE public.user_roles RENAME COLUMN role_temp TO role;
ALTER TABLE public.role_permissions RENAME COLUMN role_name_temp TO role_name;

-- 7. Adicionar foreign key constraints
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_fkey 
  FOREIGN KEY (role) REFERENCES public.role_definitions(role_name) ON DELETE CASCADE;

ALTER TABLE public.role_permissions
  ADD CONSTRAINT role_permissions_role_name_fkey 
  FOREIGN KEY (role_name) REFERENCES public.role_definitions(role_name) ON DELETE CASCADE;

-- 8. Recriar a unique constraint em user_roles
ALTER TABLE public.user_roles 
  ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- 9. Atualizar a função has_role para usar text
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

-- 10. Recriar TODAS as policies
-- Attendance records
CREATE POLICY "GA leaders can record attendance"
ON public.attendance_records FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'pastor_coordenador') OR
  public.has_role(auth.uid(), 'pastor_geral') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Pastors can view all attendance in their churches"
ON public.attendance_records FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'pastor') OR
  public.has_role(auth.uid(), 'pastor_geral') OR
  public.has_role(auth.uid(), 'admin')
);

-- Tasks
CREATE POLICY "Pastors can view all tasks in their churches" 
ON public.tasks FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'pastor') OR
  public.has_role(auth.uid(), 'pastor_geral') OR
  public.has_role(auth.uid(), 'pastor_regiao') OR
  public.has_role(auth.uid(), 'pastor_coordenador') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Pastors can create tasks"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'pastor') OR
  public.has_role(auth.uid(), 'pastor_geral') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Pastors can update tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'pastor') OR
  public.has_role(auth.uid(), 'pastor_geral') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Pastors can delete tasks"
ON public.tasks FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'pastor') OR
  public.has_role(auth.uid(), 'admin')
);

-- User roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));