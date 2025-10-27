-- Criar função de segurança para verificar roles (se não existir)
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

-- Políticas para role_definitions (criar apenas as que não existem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'role_definitions' 
    AND policyname = 'Admins can insert role definitions'
  ) THEN
    CREATE POLICY "Admins can insert role definitions"
    ON public.role_definitions
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'role_definitions' 
    AND policyname = 'Admins can update role definitions'
  ) THEN
    CREATE POLICY "Admins can update role definitions"
    ON public.role_definitions
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'role_definitions' 
    AND policyname = 'Admins can delete role definitions'
  ) THEN
    CREATE POLICY "Admins can delete role definitions"
    ON public.role_definitions
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Políticas para role_permissions (criar apenas as que não existem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'role_permissions' 
    AND policyname = 'Admins can update role permissions'
  ) THEN
    CREATE POLICY "Admins can update role permissions"
    ON public.role_permissions
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'role_permissions' 
    AND policyname = 'Admins can delete role permissions'
  ) THEN
    CREATE POLICY "Admins can delete role permissions"
    ON public.role_permissions
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;