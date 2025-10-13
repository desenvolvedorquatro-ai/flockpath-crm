-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Pastors can view their church attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can view their own churches" ON public.user_churches;
DROP POLICY IF EXISTS "Admins can view all user churches" ON public.user_churches;
DROP POLICY IF EXISTS "Pastors can view user churches" ON public.user_churches;
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.visitor_interactions;
DROP POLICY IF EXISTS "Admins can view all interactions" ON public.visitor_interactions;
DROP POLICY IF EXISTS "Pastors can view their church interactions" ON public.visitor_interactions;
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Pastors can view their church tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view visitors in their church" ON public.visitors;
DROP POLICY IF EXISTS "Admins can view all visitors" ON public.visitors;
DROP POLICY IF EXISTS "Pastors can view their church visitors" ON public.visitors;
DROP POLICY IF EXISTS "Users can view churches they belong to" ON public.churches;
DROP POLICY IF EXISTS "Admins can view all churches" ON public.churches;
DROP POLICY IF EXISTS "Pastors can view their churches" ON public.churches;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Recreate policies with correct column names (text-based, no enum casts)

-- attendance_records: uses recorded_by instead of user_id
CREATE POLICY "Users can view their own attendance" ON public.attendance_records
FOR SELECT USING (auth.uid() = recorded_by);

CREATE POLICY "Admins can view all attendance" ON public.attendance_records
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Pastors can view their church attendance" ON public.attendance_records
FOR SELECT USING (
  public.has_role(auth.uid(), 'pastor') AND
  church_id IN (SELECT church_id FROM public.user_churches WHERE user_id = auth.uid())
);

-- user_churches
CREATE POLICY "Users can view their own churches" ON public.user_churches
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user churches" ON public.user_churches
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Pastors can view user churches" ON public.user_churches
FOR SELECT USING (
  public.has_role(auth.uid(), 'pastor') AND
  church_id IN (SELECT church_id FROM public.user_churches WHERE user_id = auth.uid())
);

-- visitor_interactions: uses created_by instead of user_id
CREATE POLICY "Users can view their own interactions" ON public.visitor_interactions
FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all interactions" ON public.visitor_interactions
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Pastors can view their church interactions" ON public.visitor_interactions
FOR SELECT USING (
  public.has_role(auth.uid(), 'pastor') AND
  EXISTS (
    SELECT 1 FROM public.visitors v
    WHERE v.id = visitor_id
    AND v.church_id IN (SELECT church_id FROM public.user_churches WHERE user_id = auth.uid())
  )
);

-- tasks
CREATE POLICY "Users can view their own tasks" ON public.tasks
FOR SELECT USING (auth.uid() = assigned_to OR auth.uid() = created_by);

CREATE POLICY "Admins can view all tasks" ON public.tasks
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Pastors can view their church tasks" ON public.tasks
FOR SELECT USING (
  public.has_role(auth.uid(), 'pastor') AND
  church_id IN (SELECT church_id FROM public.user_churches WHERE user_id = auth.uid())
);

-- visitors
CREATE POLICY "Users can view visitors in their church" ON public.visitors
FOR SELECT USING (
  church_id IN (SELECT church_id FROM public.user_churches WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all visitors" ON public.visitors
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Pastors can view their church visitors" ON public.visitors
FOR SELECT USING (
  public.has_role(auth.uid(), 'pastor') AND
  church_id IN (SELECT church_id FROM public.user_churches WHERE user_id = auth.uid())
);

-- churches
CREATE POLICY "Users can view churches they belong to" ON public.churches
FOR SELECT USING (
  id IN (SELECT church_id FROM public.user_churches WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all churches" ON public.churches
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Pastors can view their churches" ON public.churches
FOR SELECT USING (
  public.has_role(auth.uid(), 'pastor') AND
  id IN (SELECT church_id FROM public.user_churches WHERE user_id = auth.uid())
);

-- profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Drop the app_role enum type completely
DROP TYPE IF EXISTS public.app_role CASCADE;