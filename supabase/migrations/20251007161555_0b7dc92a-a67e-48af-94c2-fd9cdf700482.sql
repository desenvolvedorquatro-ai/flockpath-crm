-- Adicionar coluna convidado_por à tabela visitors
ALTER TABLE public.visitors 
ADD COLUMN IF NOT EXISTS convidado_por TEXT;