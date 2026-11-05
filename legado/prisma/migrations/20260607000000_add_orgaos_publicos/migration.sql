-- Migration: add_orgaos_publicos
-- Fase 2: Estrutura de Órgãos Públicos + colunas nullable em manifestacoes/avaliacoes

-- 1. Nova tabela orgaos_publicos
CREATE TABLE "orgaos_publicos" (
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

    CONSTRAINT "orgaos_publicos_pkey" PRIMARY KEY ("id")
);

-- 2. FK orgaos_publicos -> campanhas
ALTER TABLE "orgaos_publicos"
    ADD CONSTRAINT "orgaos_publicos_campanha_id_fkey"
    FOREIGN KEY ("campanha_id") REFERENCES "campanhas"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Índices de orgaos_publicos
CREATE INDEX "orgaos_publicos_cidade_idx"  ON "orgaos_publicos"("cidade");
CREATE INDEX "orgaos_publicos_tipo_idx"    ON "orgaos_publicos"("tipo");
CREATE INDEX "orgaos_publicos_status_idx"  ON "orgaos_publicos"("status");

-- 4. Coluna orgao_id em manifestacoes (nullable, retrocompatível)
ALTER TABLE "manifestacoes"
    ADD COLUMN "orgao_id" TEXT;

ALTER TABLE "manifestacoes"
    ADD CONSTRAINT "manifestacoes_orgao_id_fkey"
    FOREIGN KEY ("orgao_id") REFERENCES "orgaos_publicos"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- candidato_id pode agora ser nullable (já era, mas garantir)
ALTER TABLE "manifestacoes"
    ALTER COLUMN "candidato_id" DROP NOT NULL;

CREATE INDEX "manifestacoes_orgao_id_idx" ON "manifestacoes"("orgao_id");

-- 5. Coluna orgao_id em avaliacoes (nullable, retrocompatível)
ALTER TABLE "avaliacoes"
    ADD COLUMN "orgao_id" TEXT;

ALTER TABLE "avaliacoes"
    ADD CONSTRAINT "avaliacoes_orgao_id_fkey"
    FOREIGN KEY ("orgao_id") REFERENCES "orgaos_publicos"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- candidato_id pode agora ser nullable
ALTER TABLE "avaliacoes"
    ALTER COLUMN "candidato_id" DROP NOT NULL;

CREATE INDEX "avaliacoes_orgao_id_idx" ON "avaliacoes"("orgao_id");
