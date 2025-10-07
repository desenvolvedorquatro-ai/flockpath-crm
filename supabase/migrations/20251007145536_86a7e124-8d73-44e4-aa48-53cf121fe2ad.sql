-- Add candidato_batismo column to visitors table
ALTER TABLE public.visitors
ADD COLUMN IF NOT EXISTS candidato_batismo BOOLEAN DEFAULT false;

-- Add data_batismo column to visitors table
ALTER TABLE public.visitors
ADD COLUMN IF NOT EXISTS data_batismo DATE;