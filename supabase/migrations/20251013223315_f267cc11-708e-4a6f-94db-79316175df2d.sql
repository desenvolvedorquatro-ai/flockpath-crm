-- Remover as 3 políticas antigas problemáticas identificadas
DROP POLICY IF EXISTS "Pastors can view user churches" ON public.user_churches;
DROP POLICY IF EXISTS "Users can view their own churches" ON public.user_churches;
DROP POLICY IF EXISTS "Admins can view all user churches" ON public.user_churches;

-- Criar política correta para pastores usando SECURITY DEFINER
CREATE POLICY "Pastors can view church assignments"
ON public.user_churches
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'pastor') 
  AND church_id IN (SELECT church_id FROM public.get_user_church_ids(auth.uid()))
);