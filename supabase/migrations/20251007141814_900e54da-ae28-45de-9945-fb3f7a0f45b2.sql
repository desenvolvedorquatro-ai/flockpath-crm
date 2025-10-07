-- Add new fields to visitor_interactions table
ALTER TABLE public.visitor_interactions
  ADD COLUMN ultimo_culto DATE,
  ADD COLUMN frequencia TEXT CHECK (frequencia IN ('semanal', 'quinzenal', 'mensal'));