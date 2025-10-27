-- Add observacao column to visitors table
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS observacao TEXT;

COMMENT ON COLUMN visitors.observacao IS 'Observações gerais sobre o visitante';