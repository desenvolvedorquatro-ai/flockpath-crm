-- Migrar dados de group_leader para Diacono
UPDATE user_roles 
SET role = 'Diacono' 
WHERE role = 'group_leader';

-- Garantir que as funções existem em role_definitions
INSERT INTO role_definitions (role_name, display_name, description, color)
VALUES ('Diacono', 'Diácono', 'Responsável por auxiliar nas atividades da igreja', 'bg-green-500')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO role_definitions (role_name, display_name, description, color)
VALUES ('obreiro', 'Obreiro', 'Colaborador nas atividades ministeriais', 'bg-teal-500')
ON CONFLICT (role_name) DO NOTHING;