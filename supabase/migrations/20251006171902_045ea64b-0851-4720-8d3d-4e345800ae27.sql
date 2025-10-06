-- Corrigir search_path nas funções

-- Corrigir função update_updated_at_column (já existe)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;

-- Recriar trigger
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Corrigir função update_role_definitions_updated_at
DROP FUNCTION IF EXISTS public.update_role_definitions_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_role_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Recriar trigger
CREATE TRIGGER update_role_definitions_updated_at
BEFORE UPDATE ON public.role_definitions
FOR EACH ROW
EXECUTE FUNCTION public.update_role_definitions_updated_at();