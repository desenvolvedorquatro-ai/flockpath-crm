-- Adicionar colunas area_id e region_id à tabela visitors (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visitors' AND column_name = 'area_id'
    ) THEN
        ALTER TABLE visitors ADD COLUMN area_id UUID REFERENCES areas(id) ON DELETE SET NULL;
        CREATE INDEX idx_visitors_area_id ON visitors(area_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visitors' AND column_name = 'region_id'
    ) THEN
        ALTER TABLE visitors ADD COLUMN region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
        CREATE INDEX idx_visitors_region_id ON visitors(region_id);
    END IF;
END $$;