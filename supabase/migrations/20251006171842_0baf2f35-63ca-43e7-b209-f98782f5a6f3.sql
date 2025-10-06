-- ETAPA 1: Adicionar CPF e tabela de múltiplas igrejas

-- Adicionar coluna CPF na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN cpf VARCHAR(14) UNIQUE;

-- Criar tabela de relacionamento many-to-many para múltiplas igrejas
CREATE TABLE public.user_churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, church_id)
);

-- RLS policies para user_churches
ALTER TABLE public.user_churches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user churches"
ON public.user_churches
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own churches"
ON public.user_churches
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ETAPA 2: Sistema de Gerenciamento de Funções Personalizadas

-- Tabela de definição de funções
CREATE TABLE public.role_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT 'bg-gray-500',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de permissões por função
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) REFERENCES public.role_definitions(role_name) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_name, module)
);

-- RLS para role_definitions
ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view role definitions"
ON public.role_definitions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage role definitions"
ON public.role_definitions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS para role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view role permissions"
ON public.role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Inserir funções padrão
INSERT INTO public.role_definitions (role_name, display_name, description, color) VALUES
('admin', 'Administrador', 'Acesso total ao sistema', 'bg-red-500'),
('pastor', 'Pastor', 'Gerencia igreja(s) específica(s)', 'bg-purple-500'),
('pastor_geral', 'Pastor Geral', 'Supervisiona todas as regiões', 'bg-blue-500'),
('pastor_regiao', 'Pastor de Região', 'Gerencia uma região específica', 'bg-indigo-500'),
('pastor_coordenador', 'Pastor Coordenador', 'Coordena áreas', 'bg-cyan-500'),
('group_leader', 'Líder de Grupo', 'Gerencia grupos de visitantes', 'bg-green-500'),
('user', 'Usuário', 'Acesso básico', 'bg-gray-500');

-- Permissões padrão para Admin
INSERT INTO public.role_permissions (role_name, module, can_view, can_create, can_edit, can_delete) VALUES
('admin', 'visitantes', true, true, true, true),
('admin', 'igrejas', true, true, true, true),
('admin', 'regioes', true, true, true, true),
('admin', 'areas', true, true, true, true),
('admin', 'grupos', true, true, true, true),
('admin', 'usuarios', true, true, true, true),
('admin', 'importacao', true, true, true, true);

-- Permissões padrão para Pastor
INSERT INTO public.role_permissions (role_name, module, can_view, can_create, can_edit, can_delete) VALUES
('pastor', 'visitantes', true, true, true, false),
('pastor', 'grupos', true, true, true, false),
('pastor', 'igrejas', true, false, true, false);

-- Permissões padrão para Pastor Geral
INSERT INTO public.role_permissions (role_name, module, can_view, can_create, can_edit, can_delete) VALUES
('pastor_geral', 'visitantes', true, true, true, true),
('pastor_geral', 'igrejas', true, true, true, false),
('pastor_geral', 'regioes', true, true, true, false),
('pastor_geral', 'areas', true, true, true, false),
('pastor_geral', 'grupos', true, true, true, true);

-- Permissões padrão para Líder de Grupo
INSERT INTO public.role_permissions (role_name, module, can_view, can_create, can_edit, can_delete) VALUES
('group_leader', 'visitantes', true, true, true, false),
('group_leader', 'grupos', true, false, true, false);

-- Permissões padrão para Usuário
INSERT INTO public.role_permissions (role_name, module, can_view, can_create, can_edit, can_delete) VALUES
('user', 'visitantes', true, false, false, false);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_role_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_role_definitions_updated_at
BEFORE UPDATE ON public.role_definitions
FOR EACH ROW
EXECUTE FUNCTION public.update_role_definitions_updated_at();