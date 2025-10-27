-- Atualizar cores inválidas para cor padrão
UPDATE role_definitions
SET color = '#6B7280'
WHERE color NOT LIKE '#%' 
  AND color NOT LIKE 'bg-%';