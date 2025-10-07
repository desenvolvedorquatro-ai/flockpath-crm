-- Create tasks table for pastors to assign tasks to GA leaders
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  assistance_group_id UUID REFERENCES public.assistance_groups(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID NOT NULL,
  created_by UUID NOT NULL,
  interaction_type TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed_date DATE,
  completion_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'overdue', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Pastors can view all tasks in their churches"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('pastor', 'pastor_geral', 'pastor_regiao', 'pastor_coordenador', 'admin')
  )
);

CREATE POLICY "GA leaders can view their assigned tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

CREATE POLICY "Pastors can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('pastor', 'pastor_geral', 'pastor_regiao', 'pastor_coordenador', 'admin')
  )
);

CREATE POLICY "Pastors can update tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('pastor', 'pastor_geral', 'pastor_regiao', 'pastor_coordenador', 'admin')
  )
);

CREATE POLICY "GA leaders can update their assigned tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid());

-- Create attendance_records table for tracking visitor attendance
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES public.visitors(id) ON DELETE CASCADE NOT NULL,
  attendance_date DATE NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('ebd', 'noite', 'outro')),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  assistance_group_id UUID REFERENCES public.assistance_groups(id) ON DELETE SET NULL,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(visitor_id, attendance_date, service_type)
);

-- Enable RLS on attendance_records
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance_records
CREATE POLICY "Pastors can view all attendance in their churches"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('pastor', 'pastor_geral', 'pastor_regiao', 'pastor_coordenador', 'admin')
  )
);

CREATE POLICY "GA leaders can view attendance in their group"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assistance_groups ag
    WHERE ag.id = attendance_records.assistance_group_id
    AND ag.leader_id = auth.uid()
  )
);

CREATE POLICY "GA leaders can record attendance"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assistance_groups ag
    WHERE ag.id = attendance_records.assistance_group_id
    AND ag.leader_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('pastor', 'pastor_geral', 'pastor_regiao', 'pastor_coordenador', 'admin')
  )
);

CREATE POLICY "GA leaders can update attendance records"
ON public.attendance_records
FOR UPDATE
TO authenticated
USING (recorded_by = auth.uid());

CREATE POLICY "GA leaders can delete attendance records"
ON public.attendance_records
FOR DELETE
TO authenticated
USING (recorded_by = auth.uid());

-- Create trigger for updating tasks status based on due date
CREATE OR REPLACE FUNCTION update_task_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_date IS NOT NULL THEN
    NEW.status := 'completed';
  ELSIF NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'overdue';
  ELSE
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_status_trigger
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_task_status();

-- Create trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add permissions for new modules (using only existing roles)
INSERT INTO public.role_permissions (role_name, module, can_view, can_create, can_edit, can_delete)
VALUES
  ('admin', 'tarefas', true, true, true, true),
  ('pastor', 'tarefas', true, true, true, true),
  ('pastor_geral', 'tarefas', true, true, true, true),
  ('pastor_regiao', 'tarefas', true, true, true, true),
  ('pastor_coordenador', 'tarefas', true, true, true, true),
  ('obreiro', 'tarefas', true, false, true, false),
  ('admin', 'frequencia', true, true, true, true),
  ('pastor', 'frequencia', true, true, true, true),
  ('pastor_geral', 'frequencia', true, true, true, true),
  ('pastor_regiao', 'frequencia', true, true, true, true),
  ('pastor_coordenador', 'frequencia', true, true, true, true),
  ('obreiro', 'frequencia', true, true, true, true)
ON CONFLICT (role_name, module) DO UPDATE
SET can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_edit = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete;