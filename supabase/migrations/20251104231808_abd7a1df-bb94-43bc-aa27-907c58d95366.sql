-- ============================================
-- AJUSTE: ACESSO UNIVERSAL AOS VISITANTES
-- Opção C: Acesso total para todos usuários autenticados
-- ============================================

-- 1. TABELA VISITORS
DROP POLICY IF EXISTS "Admins can view all visitors" ON public.visitors;
DROP POLICY IF EXISTS "Users can view accessible visitors" ON public.visitors;
DROP POLICY IF EXISTS "Authorized users can create visitors v2" ON public.visitors;
DROP POLICY IF EXISTS "Authorized users can update visitors v2" ON public.visitors;
DROP POLICY IF EXISTS "Admins and pastors can delete visitors v2" ON public.visitors;

CREATE POLICY "Authenticated users can view all visitors"
ON public.visitors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create visitors"
ON public.visitors FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update visitors"
ON public.visitors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete visitors"
ON public.visitors FOR DELETE TO authenticated USING (true);

-- 2. TABELA VISITOR_INTERACTIONS
DROP POLICY IF EXISTS "Admins can view all interactions" ON public.visitor_interactions;
DROP POLICY IF EXISTS "Admins can insert all interactions" ON public.visitor_interactions;
DROP POLICY IF EXISTS "Admins can update all interactions" ON public.visitor_interactions;
DROP POLICY IF EXISTS "Admins can delete all interactions" ON public.visitor_interactions;
DROP POLICY IF EXISTS "Group leaders can manage their visitors interactions" ON public.visitor_interactions;
DROP POLICY IF EXISTS "Pastors can view their church interactions" ON public.visitor_interactions;
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.visitor_interactions;

CREATE POLICY "Authenticated users can view all interactions"
ON public.visitor_interactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create interactions"
ON public.visitor_interactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update interactions"
ON public.visitor_interactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete interactions"
ON public.visitor_interactions FOR DELETE TO authenticated USING (true);

-- 3. TABELA ATTENDANCE_RECORDS
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can view accessible attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can record attendance for accessible visitors" ON public.attendance_records;
DROP POLICY IF EXISTS "Authorized users can update attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Authorized users can delete attendance" ON public.attendance_records;

CREATE POLICY "Authenticated users can view all attendance"
ON public.attendance_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create attendance"
ON public.attendance_records FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update attendance"
ON public.attendance_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete attendance"
ON public.attendance_records FOR DELETE TO authenticated USING (true);

-- 4. TABELA VISITOR_HISTORY
DROP POLICY IF EXISTS "Authorized users can manage visitor history" ON public.visitor_history;
DROP POLICY IF EXISTS "Users can view accessible visitor history" ON public.visitor_history;

CREATE POLICY "Authenticated users can manage all visitor history"
ON public.visitor_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. TABELA VISITOR_ATTENDANCE
DROP POLICY IF EXISTS "Authorized users can manage attendance" ON public.visitor_attendance;
DROP POLICY IF EXISTS "Users can view accessible attendance" ON public.visitor_attendance;

CREATE POLICY "Authenticated users can manage all visitor attendance"
ON public.visitor_attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);