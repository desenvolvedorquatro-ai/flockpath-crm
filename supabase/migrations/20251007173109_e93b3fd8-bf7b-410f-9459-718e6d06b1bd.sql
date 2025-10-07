-- Limpar todos os registros mantendo apenas usuários
-- Ordem: respeitar foreign keys (deletar do mais dependente ao menos dependente)

-- 1. Deletar registros de frequência
DELETE FROM attendance_records;

-- 2. Deletar visitantes
DELETE FROM visitors;

-- 3. Deletar grupos de assistência
DELETE FROM assistance_groups;

-- 4. Deletar igrejas
DELETE FROM churches;

-- 5. Deletar áreas
DELETE FROM areas;

-- 6. Deletar regiões
DELETE FROM regions;