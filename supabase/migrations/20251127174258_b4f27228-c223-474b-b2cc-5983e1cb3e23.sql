-- Adicionar coluna active na tabela visitors
ALTER TABLE public.visitors 
ADD COLUMN active boolean DEFAULT true NOT NULL;

-- Criar índice para melhor performance nas queries
CREATE INDEX idx_visitors_active ON public.visitors(active);

-- Comentário explicativo
COMMENT ON COLUMN public.visitors.active IS 'Indica se o visitante está ativo no sistema. Inativos não aparecem em dashboards mas permanecem no sistema.';