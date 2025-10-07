-- Converter visitantes com status "interessado" para "visitante"
UPDATE visitors
SET status = 'visitante'
WHERE status = 'interessado';

-- Criar novo enum sem "interessado"
CREATE TYPE visitor_status_new AS ENUM ('visitante', 'em_assistencia', 'batizado');

-- Atualizar a coluna para usar o novo enum
ALTER TABLE visitors 
  ALTER COLUMN status TYPE visitor_status_new 
  USING status::text::visitor_status_new;

-- Remover o enum antigo e renomear o novo
DROP TYPE visitor_status;
ALTER TYPE visitor_status_new RENAME TO visitor_status;