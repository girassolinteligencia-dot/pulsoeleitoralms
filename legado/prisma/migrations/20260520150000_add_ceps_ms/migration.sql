CREATE TABLE "ceps_ms" (
    "cep" TEXT NOT NULL,
    "uf" TEXT NOT NULL DEFAULT 'MS',
    "cidade" TEXT NOT NULL,
    "bairro" TEXT,
    "logradouro" TEXT,
    "origem" TEXT NOT NULL DEFAULT 'brasilapi',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ceps_ms_pkey" PRIMARY KEY ("cep")
);

CREATE INDEX "ceps_ms_cidade_idx" ON "ceps_ms"("cidade");
CREATE INDEX "ceps_ms_bairro_idx" ON "ceps_ms"("bairro");
