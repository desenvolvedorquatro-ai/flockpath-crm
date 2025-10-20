-- Criar tabela de configuração de status
CREATE TABLE IF NOT EXISTS visitor_status_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,
  label text NOT NULL,
  color text NOT NULL,
  hex_color text NOT NULL,
  order_position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de configuração de categorias
CREATE TABLE IF NOT EXISTS visitor_category_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,
  label text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  order_position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir valores padrão de status
INSERT INTO visitor_status_config (value, label, color, hex_color, order_position) VALUES
('interessado', 'Interessado', 'bg-gray-500/10 text-gray-500 border-gray-500/20', '#6B7280', 1),
('visitante', 'Visitante', 'bg-blue-500/10 text-blue-500 border-blue-500/20', '#3B82F6', 2),
('visitante_frequente', 'Visitante Frequente', 'bg-purple-500/10 text-purple-500 border-purple-500/20', '#8B5CF6', 3),
('candidato_batismo', 'Candidato à Batismo', 'bg-orange-500/10 text-orange-500 border-orange-500/20', '#F59E0B', 4),
('membro', 'Membro', 'bg-green-500/10 text-green-500 border-green-500/20', '#10B981', 5);

-- Inserir valores padrão de categoria
INSERT INTO visitor_category_config (value, label, order_position) VALUES
('crianca', 'Criança', 1),
('intermediario', 'Intermediário', 2),
('adolescente', 'Adolescente', 3),
('jovem', 'Jovem', 4),
('senhora', 'Senhora', 5),
('varao', 'Varão', 6),
('idoso', 'Idoso', 7);

-- RLS Policies (apenas admins podem modificar)
ALTER TABLE visitor_status_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_category_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver status" ON visitor_status_config FOR SELECT USING (true);
CREATE POLICY "Apenas admins podem gerenciar status" ON visitor_status_config FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Todos podem ver categorias" ON visitor_category_config FOR SELECT USING (true);
CREATE POLICY "Apenas admins podem gerenciar categorias" ON visitor_category_config FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Criar função para buscar último acesso do usuário
CREATE OR REPLACE FUNCTION get_user_last_sign_in(user_id uuid)
RETURNS timestamptz AS $$
  SELECT last_sign_in_at FROM auth.users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;