-- Migration: add_servicos_publicos
-- Fase 3: Estrutura de Serviços Públicos + colunas nullable em manifestacoes/avaliacoes

-- 1. Nova tabela servicos_publicos
CREATE TABLE "servicos_publicos" (
    "id"            TEXT NOT NULL,
    "nome"          TEXT NOT NULL,
    "tipo"          TEXT NOT NULL,
    "cidade"        TEXT NOT NULL,
    "uf"            TEXT NOT NULL DEFAULT 'MS',
    "descricao"     TEXT,
    "foto_url"      TEXT,
    "campanha_id"   TEXT,
    "status"        TEXT NOT NULL DEFAULT 'Ativo',
    "criado_em"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_publicos_pkey" PRIMARY KEY ("id")
);

-- 2. FK servicos_publicos -> campanhas
ALTER TABLE "servicos_publicos"
    ADD CONSTRAINT "servicos_publicos_campanha_id_fkey"
    FOREIGN KEY ("campanha_id") REFERENCES "campanhas"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Índices de servicos_publicos
CREATE INDEX "servicos_publicos_cidade_idx" ON "servicos_publicos"("cidade");
CREATE INDEX "servicos_publicos_tipo_idx"   ON "servicos_publicos"("tipo");
CREATE INDEX "servicos_publicos_status_idx" ON "servicos_publicos"("status");

-- 4. Coluna servico_id em manifestacoes (nullable)
ALTER TABLE "manifestacoes"
    ADD COLUMN "servico_id" TEXT;

ALTER TABLE "manifestacoes"
    ADD CONSTRAINT "manifestacoes_servico_id_fkey"
    FOREIGN KEY ("servico_id") REFERENCES "servicos_publicos"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "manifestacoes_servico_id_idx" ON "manifestacoes"("servico_id");

-- 5. Coluna servico_id em avaliacoes (nullable)
ALTER TABLE "avaliacoes"
    ADD COLUMN "servico_id" TEXT;

ALTER TABLE "avaliacoes"
    ADD CONSTRAINT "avaliacoes_servico_id_fkey"
    FOREIGN KEY ("servico_id") REFERENCES "servicos_publicos"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "avaliacoes_servico_id_idx" ON "avaliacoes"("servico_id");
