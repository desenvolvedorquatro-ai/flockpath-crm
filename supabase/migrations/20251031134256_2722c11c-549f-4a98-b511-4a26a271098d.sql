-- Verificar/adicionar foreign key com assistance_groups (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_group_access_group_id_fkey'
  ) THEN
    ALTER TABLE public.user_group_access
      ADD CONSTRAINT user_group_access_group_id_fkey 
      FOREIGN KEY (group_id) 
      REFERENCES public.assistance_groups(id) 
      ON DELETE CASCADE;
  END IF;
END $$;