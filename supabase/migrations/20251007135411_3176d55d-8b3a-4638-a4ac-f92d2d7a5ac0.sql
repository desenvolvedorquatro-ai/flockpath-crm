-- Criar enum para categoria de visitante
CREATE TYPE public.visitor_category AS ENUM (
  'crianca',
  'intermediario', 
  'adolescente',
  'jovem',
  'senhora',
  'varao',
  'idoso'
);

-- Criar enum para sexo
CREATE TYPE public.visitor_gender AS ENUM (
  'masculino',
  'feminino'
);

-- Adicionar novos campos à tabela visitors
ALTER TABLE public.visitors
  ADD COLUMN categoria public.visitor_category,
  ADD COLUMN sexo public.visitor_gender,
  ADD COLUMN profissao TEXT,
  ADD COLUMN responsavel_assistencia TEXT,
  ADD COLUMN participacao_seminario TEXT;