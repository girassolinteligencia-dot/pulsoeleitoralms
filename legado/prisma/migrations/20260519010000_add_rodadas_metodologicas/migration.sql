-- Adds methodological rounds for PULSO ELEITORAL MS.
-- Apply only after checking drift in the target database.

CREATE TABLE IF NOT EXISTS "rodadas_metodologicas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'percepcao_espontanea',
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "campanha_id" TEXT,
    "objetivo" TEXT,
    "publico_alvo" TEXT,
    "abrangencia" TEXT,
    "tamanho_amostra" INTEGER,
    "margem_erro" DOUBLE PRECISION,
    "nivel_confianca" DOUBLE PRECISION,
    "periodo_inicio" TIMESTAMP(3),
    "periodo_fim" TIMESTAMP(3),
    "plano_amostral" JSONB,
    "ponderacao" JSONB,
    "questionario" JSONB,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rodadas_metodologicas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "rodadas_metodologicas_campanha_id_idx" ON "rodadas_metodologicas"("campanha_id");
CREATE INDEX IF NOT EXISTS "rodadas_metodologicas_tipo_status_idx" ON "rodadas_metodologicas"("tipo", "status");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'rodadas_metodologicas_campanha_id_fkey'
    ) THEN
        ALTER TABLE "rodadas_metodologicas"
        ADD CONSTRAINT "rodadas_metodologicas_campanha_id_fkey"
        FOREIGN KEY ("campanha_id") REFERENCES "campanhas"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
