-- Criar tabela de configurações do sistema
CREATE TABLE public.system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value text NOT NULL,
  config_type text NOT NULL, -- 'number', 'string', 'boolean'
  description text,
  editable_by_admin boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir configuração padrão de tempo de sessão (30 minutos)
INSERT INTO public.system_config (config_key, config_value, config_type, description, editable_by_admin)
VALUES 
  ('session_timeout_minutes', '30', 'number', 'Tempo de expiração da sessão em minutos (por inatividade)', true),
  ('session_inactivity_timeout', 'true', 'boolean', 'Ativar logout automático por inatividade', true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON public.system_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Admins podem ver configurações
CREATE POLICY "Admins can view system config"
  ON public.system_config FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Admins podem atualizar configurações
CREATE POLICY "Admins can update system config"
  ON public.system_config FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));