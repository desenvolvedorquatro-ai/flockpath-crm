-- Passo 1: Criar novo tipo ENUM com todos os status
CREATE TYPE visitor_status_new AS ENUM (
  'interessado',
  'visitante', 
  'visitante_frequente',
  'candidato_batismo',
  'membro'
);

-- Passo 2: Converter status existentes para o novo modelo
-- Mapeamento:
-- 'visitante' → 'visitante' (permanece igual)
-- 'em_assistencia' → 'visitante_frequente' (transição lógica)
-- 'batizado' → 'membro' (batizados agora são membros)

-- Passo 3: Alterar coluna status para usar novo tipo
ALTER TABLE visitors 
  ALTER COLUMN status TYPE visitor_status_new 
  USING (
    CASE status::text
      WHEN 'visitante' THEN 'visitante'::visitor_status_new
      WHEN 'em_assistencia' THEN 'visitante_frequente'::visitor_status_new
      WHEN 'batizado' THEN 'membro'::visitor_status_new
      ELSE 'visitante'::visitor_status_new
    END
  );

-- Passo 4: Remover tipo antigo e renomear novo
DROP TYPE visitor_status;
ALTER TYPE visitor_status_new RENAME TO visitor_status;

-- Passo 5: Adicionar coluna 'resgate' (boolean)
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS resgate BOOLEAN DEFAULT false;

-- Criar índice para performance em queries de resgate
CREATE INDEX IF NOT EXISTS idx_visitors_resgate ON visitors(resgate);