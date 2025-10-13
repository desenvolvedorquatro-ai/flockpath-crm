-- Primeiro, vamos verificar e corrigir TODAS as políticas da tabela user_churches
-- que podem estar causando recursão

-- Dropar TODAS as políticas existentes em user_churches
DROP POLICY IF EXISTS "Users can view their own church assignments" ON public.user_churches;
DROP POLICY IF EXISTS "Users can view their church assignments" ON public.user_churches;
DROP POLICY IF EXISTS "Admins can view all church assignments" ON public.user_churches;
DROP POLICY IF EXISTS "Admins can insert church assignments" ON public.user_churches;
DROP POLICY IF EXISTS "Admins can update church assignments" ON public.user_churches;
DROP POLICY IF EXISTS "Admins can delete church assignments" ON public.user_churches;

-- Criar políticas SIMPLES e DIRETAS para user_churches
-- SEM subconsultas que possam causar recursão

CREATE POLICY "Users can view their own church assignments"
ON public.user_churches
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

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