-- Baseline schema for PULSO ELEITORAL MS.
-- Generated from prisma/schema.prisma with:
-- npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
--
-- This file is versioned for reproducibility. Do not apply to an existing
-- production database without first checking drift and creating a backup.

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "campanhas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "total_votos" INTEGER NOT NULL DEFAULT 0,
    "media_consolidada" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_calc_at" TIMESTAMP(3),
    "meta_config" JSONB,
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(3),
    CONSTRAINT "campanhas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "atributos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "icone" TEXT,
    "polaridade" INTEGER NOT NULL DEFAULT 1,
    "visivel" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "atributos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "campanha_atributos" (
    "id" TEXT NOT NULL,
    "campanha_id" TEXT NOT NULL,
    "atributo_id" TEXT NOT NULL,
    CONSTRAINT "campanha_atributos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "candidatos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "partido" TEXT,
    "numero" TEXT,
    "cargo" TEXT NOT NULL,
    "foto_url" TEXT,
    "ano_eleicao" INTEGER NOT NULL DEFAULT 2024,
    "cidade" TEXT NOT NULL,
    "bairro" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "status_verificacao" BOOLEAN NOT NULL DEFAULT false,
    "total_avaliacoes" INTEGER NOT NULL DEFAULT 0,
    "campanha_id" TEXT NOT NULL,
    CONSTRAINT "candidatos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "manifestacoes" (
    "id" TEXT NOT NULL,
    "candidato_id" TEXT NOT NULL,
    "aprovacao" BOOLEAN,
    "expectativa_vitoria" BOOLEAN,
    "perfil" JSONB,
    "fingerprint_hash" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "duration_ms" INTEGER,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "honeypot_triggered" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "manifestacoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "manifestacao_id" TEXT,
    "candidato_id" TEXT NOT NULL,
    "atributo_id" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "fingerprint_hash" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "duration_ms" INTEGER,
    "honeypot_triggered" BOOLEAN NOT NULL DEFAULT false,
    "device_info" JSONB,
    "geo_location" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bloqueios" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "motivo" TEXT,
    "expira_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bloqueios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "detalhes" JSONB,
    "usuario_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parametros_plataforma" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "grupo" TEXT NOT NULL DEFAULT 'geral',
    "descricao" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "parametros_plataforma_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rodadas_metodologicas" (
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

CREATE UNIQUE INDEX "campanhas_slug_key" ON "campanhas"("slug");
CREATE UNIQUE INDEX "atributos_nome_key" ON "atributos"("nome");
CREATE INDEX "manifestacoes_candidato_id_idx" ON "manifestacoes"("candidato_id");
CREATE INDEX "manifestacoes_fingerprint_hash_idx" ON "manifestacoes"("fingerprint_hash");
CREATE INDEX "avaliacoes_candidato_id_idx" ON "avaliacoes"("candidato_id");
CREATE INDEX "avaliacoes_manifestacao_id_idx" ON "avaliacoes"("manifestacao_id");
CREATE UNIQUE INDEX "bloqueios_hash_key" ON "bloqueios"("hash");
CREATE UNIQUE INDEX "parametros_plataforma_chave_key" ON "parametros_plataforma"("chave");
CREATE INDEX "rodadas_metodologicas_campanha_id_idx" ON "rodadas_metodologicas"("campanha_id");
CREATE INDEX "rodadas_metodologicas_tipo_status_idx" ON "rodadas_metodologicas"("tipo", "status");

CREATE INDEX IF NOT EXISTS "candidatos_status_ano_cidade_idx" ON "candidatos"("status", "ano_eleicao", "cidade");
CREATE INDEX IF NOT EXISTS "avaliacoes_candidato_criado_valid_idx" ON "avaliacoes"("candidato_id", "criado_em", "is_valid");
CREATE INDEX IF NOT EXISTS "avaliacoes_atributo_criado_valid_idx" ON "avaliacoes"("atributo_id", "criado_em", "is_valid");
CREATE INDEX IF NOT EXISTS "manifestacoes_candidato_criado_valid_idx" ON "manifestacoes"("candidato_id", "criado_em", "is_valid");
CREATE INDEX IF NOT EXISTS "manifestacoes_ip_criado_idx" ON "manifestacoes"("ip_hash", "criado_em");

ALTER TABLE "campanha_atributos" ADD CONSTRAINT "campanha_atributos_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "campanhas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campanha_atributos" ADD CONSTRAINT "campanha_atributos_atributo_id_fkey" FOREIGN KEY ("atributo_id") REFERENCES "atributos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "campanhas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "manifestacoes" ADD CONSTRAINT "manifestacoes_candidato_id_fkey" FOREIGN KEY ("candidato_id") REFERENCES "candidatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_manifestacao_id_fkey" FOREIGN KEY ("manifestacao_id") REFERENCES "manifestacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_candidato_id_fkey" FOREIGN KEY ("candidato_id") REFERENCES "candidatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_atributo_id_fkey" FOREIGN KEY ("atributo_id") REFERENCES "atributos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rodadas_metodologicas" ADD CONSTRAINT "rodadas_metodologicas_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "campanhas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
