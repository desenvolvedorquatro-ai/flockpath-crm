-- Adicionar colunas estado_civil e tem_filhos à tabela visitors
ALTER TABLE public.visitors 
ADD COLUMN IF NOT EXISTS estado_civil TEXT,
ADD COLUMN IF NOT EXISTS tem_filhos BOOLEAN;