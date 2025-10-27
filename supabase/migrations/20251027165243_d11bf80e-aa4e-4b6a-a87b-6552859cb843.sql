-- Alterar o default da coluna color na tabela role_definitions
-- para usar hexadecimal ao invés de classe Tailwind
ALTER TABLE role_definitions 
ALTER COLUMN color SET DEFAULT '#6B7280';

-- Garantir que a coluna não aceite valores NULL
ALTER TABLE role_definitions 
ALTER COLUMN color SET NOT NULL;

-- Atualizar todas as cores existentes que ainda estejam em formato Tailwind para hexadecimal
UPDATE role_definitions
SET color = CASE
  WHEN color = 'bg-red-500' THEN '#EF4444'
  WHEN color = 'bg-blue-500' THEN '#3B82F6'
  WHEN color = 'bg-green-500' THEN '#22C55E'
  WHEN color = 'bg-purple-500' THEN '#A855F7'
  WHEN color = 'bg-violet-500' THEN '#8B5CF6'
  WHEN color = 'bg-gray-500' THEN '#6B7280'
  WHEN color = 'bg-orange-500' THEN '#F97316'
  WHEN color = 'bg-yellow-500' THEN '#EAB308'
  WHEN color = 'bg-pink-500' THEN '#EC4899'
  WHEN color = 'bg-indigo-500' THEN '#6366F1'
  -- Adicionar mais conversões conforme necessário
  ELSE color -- Manter se já for hexadecimal
END
WHERE color NOT LIKE '#%';