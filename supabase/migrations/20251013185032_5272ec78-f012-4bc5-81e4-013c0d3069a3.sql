-- Adicionar os novos valores ao enum app_role existente
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'Diacono';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'obreiro';