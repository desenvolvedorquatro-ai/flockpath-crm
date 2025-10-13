-- Primeiro, ajustar as foreign keys para ON DELETE SET NULL em vez de CASCADE
-- Isso garante que visitantes não sejam excluídos quando igreja/área/região forem excluídos

-- Remover constraint existente de church_id e adicionar nova com SET NULL
ALTER TABLE public.visitors
  DROP CONSTRAINT IF EXISTS visitors_church_id_fkey;

ALTER TABLE public.visitors
  ADD CONSTRAINT visitors_church_id_fkey
  FOREIGN KEY (church_id)
  REFERENCES public.churches(id)
  ON DELETE SET NULL;

-- Remover constraint existente de area_id e adicionar nova com SET NULL
ALTER TABLE public.visitors
  DROP CONSTRAINT IF EXISTS visitors_area_id_fkey;

ALTER TABLE public.visitors
  ADD CONSTRAINT visitors_area_id_fkey
  FOREIGN KEY (area_id)
  REFERENCES public.areas(id)
  ON DELETE SET NULL;

-- Remover constraint existente de region_id e adicionar nova com SET NULL
ALTER TABLE public.visitors
  DROP CONSTRAINT IF EXISTS visitors_region_id_fkey;

ALTER TABLE public.visitors
  ADD CONSTRAINT visitors_region_id_fkey
  FOREIGN KEY (region_id)
  REFERENCES public.regions(id)
  ON DELETE SET NULL;

-- Remover constraint existente de assistance_group_id e adicionar nova com SET NULL
ALTER TABLE public.visitors
  DROP CONSTRAINT IF EXISTS visitors_assistance_group_id_fkey;

ALTER TABLE public.visitors
  ADD CONSTRAINT visitors_assistance_group_id_fkey
  FOREIGN KEY (assistance_group_id)
  REFERENCES public.assistance_groups(id)
  ON DELETE SET NULL;

-- Agora limpar todos os dados exceto o usuário admin@sistema.com

-- 1. Deletar todas as interações de visitantes
DELETE FROM public.visitor_interactions;

-- 2. Deletar todos os visitantes
DELETE FROM public.visitors;

-- 3. Deletar todas as tarefas
DELETE FROM public.tasks;

-- 4. Deletar todos os grupos de assistência
DELETE FROM public.assistance_groups;

-- 5. Deletar todas as igrejas
DELETE FROM public.churches;

-- 6. Deletar todas as áreas
DELETE FROM public.areas;

-- 7. Deletar todas as regiões
DELETE FROM public.regions;

-- 8. Deletar permissões de usuários que não são admin@sistema.com
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM public.profiles
  WHERE email != 'admin@sistema.com'
);

-- 9. Deletar perfis de usuários que não são admin@sistema.com
DELETE FROM public.profiles
WHERE email != 'admin@sistema.com';

-- 10. Deletar usuários do auth que não são admin@sistema.com
-- Nota: Esta operação pode precisar ser feita manualmente via painel
-- pois não temos acesso direto à tabela auth.users via SQL público