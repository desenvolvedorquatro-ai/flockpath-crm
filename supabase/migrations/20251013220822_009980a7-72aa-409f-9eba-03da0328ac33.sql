-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_church_ids(_user_id uuid)
RETURNS TABLE(church_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT church_id
  FROM public.user_churches
  WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_church(_user_id uuid, _church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_churches
    WHERE user_id = _user_id
      AND church_id = _church_id
  );
$$;

-- Fix churches table policies
DROP POLICY IF EXISTS "Pastors can view their churches" ON public.churches;
DROP POLICY IF EXISTS "Users can view churches they belong to" ON public.churches;
DROP POLICY IF EXISTS "Users can view their church" ON public.churches;

CREATE POLICY "Pastors can view their churches"
ON public.churches
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'pastor') 
  AND id IN (SELECT church_id FROM public.get_user_church_ids(auth.uid()))
);

CREATE POLICY "Users can view churches they belong to"
ON public.churches
FOR SELECT
TO authenticated
USING (
  id IN (SELECT church_id FROM public.get_user_church_ids(auth.uid()))
);

-- Fix visitors table policies
DROP POLICY IF EXISTS "Pastors can view their church visitors" ON public.visitors;
DROP POLICY IF EXISTS "Users can view visitors in their church" ON public.visitors;
DROP POLICY IF EXISTS "Users can insert visitors in their church" ON public.visitors;
DROP POLICY IF EXISTS "Users can update visitors in their church" ON public.visitors;
DROP POLICY IF EXISTS "Users can delete visitors in their church" ON public.visitors;

CREATE POLICY "Pastors can view their church visitors"
ON public.visitors
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'pastor')
  AND public.user_belongs_to_church(auth.uid(), church_id)
);

CREATE POLICY "Users can view visitors in their church"
ON public.visitors
FOR SELECT
TO authenticated
USING (
  public.user_belongs_to_church(auth.uid(), church_id)
);

CREATE POLICY "Users can insert visitors in their church"
ON public.visitors
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_belongs_to_church(auth.uid(), church_id)
);

CREATE POLICY "Users can update visitors in their church"
ON public.visitors
FOR UPDATE
TO authenticated
USING (
  public.user_belongs_to_church(auth.uid(), church_id)
);

CREATE POLICY "Users can delete visitors in their church"
ON public.visitors
FOR DELETE
TO authenticated
USING (
  public.user_belongs_to_church(auth.uid(), church_id)
);