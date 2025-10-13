
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their church assignments" ON public.user_churches;
DROP POLICY IF EXISTS "Users can view churches they are assigned to" ON public.user_churches;
DROP POLICY IF EXISTS "Admins can manage all church assignments" ON public.user_churches;
DROP POLICY IF EXISTS "Users can view own assignments" ON public.user_churches;

-- Create security definer function to check if user can access church data
CREATE OR REPLACE FUNCTION public.user_has_church_access(_user_id uuid, _church_id uuid)
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
  )
$$;

-- Create security definer function to check if user is assigned to any church
CREATE OR REPLACE FUNCTION public.is_user_assigned_to_church(_user_id uuid)
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
  )
$$;

-- Create new RLS policies using security definer functions
CREATE POLICY "Admins can view all church assignments"
ON public.user_churches
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own church assignments"
ON public.user_churches
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

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
