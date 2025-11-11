-- Alterar a coluna status de ENUM para TEXT para permitir status dinâmicos
ALTER TABLE visitors 
ALTER COLUMN status TYPE TEXT;

-- Fazer o mesmo para a coluna categoria
ALTER TABLE visitors 
ALTER COLUMN categoria TYPE TEXT;

-- Remover os tipos ENUM antigos se existirem
DROP TYPE IF EXISTS visitor_status CASCADE;
DROP TYPE IF EXISTS visitor_categoria CASCADE;