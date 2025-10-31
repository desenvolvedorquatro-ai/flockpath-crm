-- ====================================
-- CORREÇÕES DE SEGURANÇA CRÍTICAS
-- ====================================

-- 1. CORRIGIR EXPOSIÇÃO DE DADOS PESSOAIS NA TABELA PROFILES
-- Remover política permissiva que expõe todos os perfis

DROP POLICY IF EXISTS "Users can view profiles with region/area info" ON public.profiles;

-- Criar políticas mais restritivas
CREATE POLICY "Users can view own profile details"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view limited profile info"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'pastor_geral')
  OR has_role(auth.uid(), 'pastor_regiao')
  OR has_role(auth.uid(), 'pastor_coordenador')
);

-- 2. CORRIGIR EXPOSIÇÃO DE DADOS DE IGREJAS
-- Remover políticas que expõem dados de contato

DROP POLICY IF EXISTS "Users can view churches they belong to" ON public.churches;

-- Criar política que oculta informações sensíveis
CREATE POLICY "Users can view basic church info"
ON public.churches
FOR SELECT
USING (
  -- Admins veem tudo
  has_role(auth.uid(), 'admin')
  OR 
  -- Pastores gerais veem tudo
  has_role(auth.uid(), 'pastor_geral')
  OR
  -- Usuários só veem igrejas às quais pertencem (sem emails/phones expostos publicamente)
  (id IN (
    SELECT church_id 
    FROM get_user_church_ids(auth.uid())
  ))
);

-- 3. ADICIONAR POLÍTICAS RLS PARA CHURCH_PERMISSIONS
ALTER TABLE public.church_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage church permissions" ON public.church_permissions;
DROP POLICY IF EXISTS "Users can view own church permissions" ON public.church_permissions;

CREATE POLICY "Admins can manage church permissions"
ON public.church_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own church permissions"
ON public.church_permissions
FOR SELECT
USING (user_id = auth.uid());

-- 4. RESTRINGIR ACESSO ÀS TABELAS DE ESTRUTURA ORGANIZACIONAL
-- Regions

DROP POLICY IF EXISTS "Everyone can view regions" ON public.regions;

CREATE POLICY "Authenticated users can view regions"
ON public.regions
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'pastor_geral')
  OR has_role(auth.uid(), 'pastor_regiao')
  OR has_role(auth.uid(), 'pastor_coordenador')
  OR has_role(auth.uid(), 'pastor')
);

-- Areas

DROP POLICY IF EXISTS "Everyone can view areas" ON public.areas;

CREATE POLICY "Authenticated users can view areas"
ON public.areas
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'pastor_geral')
  OR has_role(auth.uid(), 'pastor_regiao')
  OR has_role(auth.uid(), 'pastor_coordenador')
  OR has_role(auth.uid(), 'pastor')
);

-- 5. ADICIONAR POLÍTICA RLS PARA EVENTS (estava sem políticas)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view events in their churches" ON public.events;
DROP POLICY IF EXISTS "Admins and pastors can manage events" ON public.events;

CREATE POLICY "Users can view events in their churches"
ON public.events
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'pastor_geral')
  OR (church_id IN (
    SELECT church_id 
    FROM get_user_church_ids(auth.uid())
  ))
);

CREATE POLICY "Admins and pastors can manage events"
ON public.events
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'pastor_geral')
  OR (has_role(auth.uid(), 'pastor') AND church_id IN (
    SELECT church_id 
    FROM get_user_church_ids(auth.uid())
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'pastor_geral')
  OR (has_role(auth.uid(), 'pastor') AND church_id IN (
    SELECT church_id 
    FROM get_user_church_ids(auth.uid())
  ))
);

-- 6. MELHORAR POLÍTICAS DE VISITOR_ATTENDANCE E VISITOR_HISTORY
DROP POLICY IF EXISTS "Users can insert attendance" ON public.visitor_attendance;

CREATE POLICY "Authorized users can manage attendance"
ON public.visitor_attendance
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR visitor_id IN (
    SELECT visitor_id 
    FROM get_accessible_visitor_ids(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR visitor_id IN (
    SELECT visitor_id 
    FROM get_accessible_visitor_ids(auth.uid())
  )
);

CREATE POLICY "Users can view accessible attendance"
ON public.visitor_attendance
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR visitor_id IN (
    SELECT visitor_id 
    FROM get_accessible_visitor_ids(auth.uid())
  )
);

-- Visitor History
DROP POLICY IF EXISTS "Users can insert visitor history" ON public.visitor_history;

CREATE POLICY "Authorized users can manage visitor history"
ON public.visitor_history
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR visitor_id IN (
    SELECT visitor_id 
    FROM get_accessible_visitor_ids(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR visitor_id IN (
    SELECT visitor_id 
    FROM get_accessible_visitor_ids(auth.uid())
  )
);

CREATE POLICY "Users can view accessible visitor history"
ON public.visitor_history
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR visitor_id IN (
    SELECT visitor_id 
    FROM get_accessible_visitor_ids(auth.uid())
  )
);