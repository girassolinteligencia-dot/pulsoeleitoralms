-- Migração Manual para VOZ PÚBLICA

-- Adicionar campo status em campanhas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campanhas' AND column_name='status') THEN
        ALTER TABLE campanhas ADD COLUMN status TEXT DEFAULT 'ativo';
    END IF;
END $$;

-- Adicionar campos em candidatos
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidatos' AND column_name='partido') THEN
        ALTER TABLE candidatos ADD COLUMN partido TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidatos' AND column_name='numero') THEN
        ALTER TABLE candidatos ADD COLUMN numero TEXT;
    END IF;
END $$;

-- Garantir que os índices de performance existam
CREATE INDEX IF NOT EXISTS idx_candidatos_cargo ON candidatos(cargo);
CREATE INDEX IF NOT EXISTS idx_candidatos_cidade ON candidatos(cidade);
