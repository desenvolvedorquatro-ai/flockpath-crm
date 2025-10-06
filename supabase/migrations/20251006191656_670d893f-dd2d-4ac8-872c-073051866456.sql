-- Adicionar coluna temporária do tipo text
ALTER TABLE visitors ADD COLUMN status_temp TEXT;

-- Copiar e converter os valores
UPDATE visitors 
SET status_temp = CASE 
  WHEN status = 'novo_membro' THEN 'batizado'
  WHEN status = 'em_acompanhamento' THEN 'em_assistencia'
  WHEN status = 'engajado' THEN 'interessado'
  ELSE status::text
END;

-- Remover a coluna antiga
ALTER TABLE visitors DROP COLUMN status;

-- Criar o novo enum com os valores corretos
DROP TYPE IF EXISTS visitor_status;
CREATE TYPE visitor_status AS ENUM ('visitante', 'interessado', 'em_assistencia', 'batizado');

-- Renomear a coluna temporária e converter para o enum
ALTER TABLE visitors 
  RENAME COLUMN status_temp TO status;

ALTER TABLE visitors 
  ALTER COLUMN status TYPE visitor_status USING status::visitor_status;

-- Definir NOT NULL se necessário
ALTER TABLE visitors ALTER COLUMN status SET NOT NULL;