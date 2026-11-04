import "server-only";
import { and, count, eq, gt, gte, inArray, isNull, or, sql } from "drizzle-orm";
import type { DB } from "@/server/db/client";
import {
  atributos,
  auditLogs,
  avaliacoes,
  bloqueios,
  campanhaAtributos,
  campanhas,
  candidatos,
  manifestacoes,
  orgaosPublicos,
  servicosPublicos,
} from "@/server/db/schema";
import { getPublicScopeConfig, publicCandidateConditions } from "./scope";

export type AlvoTipo = "candidato" | "orgao" | "servico";
export type Alvo = { tipo: AlvoTipo; id: string };

/** Verifica se o alvo está disponível para avaliação pública. */
export async function alvoDisponivel(db: DB, alvo: Alvo): Promise<boolean> {
  if (alvo.tipo === "orgao") {
    const r = await db
      .select({ id: orgaosPublicos.id })
      .from(orgaosPublicos)
      .where(
        and(eq(orgaosPublicos.id, alvo.id), eq(orgaosPublicos.status, "Ativo")),
      )
      .limit(1);
    return r.length > 0;
  }
  if (alvo.tipo === "servico") {
    const r = await db
      .select({ id: servicosPublicos.id })
      .from(servicosPublicos)
      .where(
        and(
          eq(servicosPublicos.id, alvo.id),
          eq(servicosPublicos.status, "Ativo"),
        ),
      )
      .limit(1);
    return r.length > 0;
  }
  const scope = await getPublicScopeConfig(db);
  const r = await db
    .select({ id: candidatos.id })
    .from(candidatos)
    .innerJoin(campanhas, eq(campanhas.id, candidatos.campanha_id))
    .where(publicCandidateConditions(scope, eq(candidatos.id, alvo.id)))
    .limit(1);
  return r.length > 0;
}

async function atributosVisiveisDaCampanha(db: DB, campanhaId: string) {
  const rows = await db
    .select({ id: campanhaAtributos.atributo_id })
    .from(campanhaAtributos)
    .innerJoin(atributos, eq(atributos.id, campanhaAtributos.atributo_id))
    .where(
      and(
        eq(campanhaAtributos.campanha_id, campanhaId),
        eq(atributos.visivel, true),
      ),
    );
  return rows.map((r) => r.id);
}

async function atributosVisiveisDaCategoria(db: DB, categoria: string) {
  const rows = await db
    .select({ id: atributos.id })
    .from(atributos)
    .where(
      and(eq(atributos.visivel, true), eq(atributos.categoria, categoria)),
    );
  return rows.map((r) => r.id);
}

/**
 * Resolve a campanha do alvo e os atributos aceitos.
 * Órgãos/serviços sem atributos na campanha caem para os atributos globais da categoria.
 * Retorna null se o alvo estiver indisponível.
 */
export async function resolverRegrasDoAlvo(
  db: DB,
  alvo: Alvo,
): Promise<{
  campanhaId: string | null;
  atributosPermitidos: Set<string>;
} | null> {
  if (alvo.tipo === "candidato") {
    const scope = await getPublicScopeConfig(db);
    const [c] = await db
      .select({ campanha_id: candidatos.campanha_id })
      .from(candidatos)
      .innerJoin(campanhas, eq(campanhas.id, candidatos.campanha_id))
      .where(publicCandidateConditions(scope, eq(candidatos.id, alvo.id)))
      .limit(1);
    if (!c) return null;
    return {
      campanhaId: c.campanha_id,
      atributosPermitidos: new Set(
        await atributosVisiveisDaCampanha(db, c.campanha_id),
      ),
    };
  }

  const tabela = alvo.tipo === "orgao" ? orgaosPublicos : servicosPublicos;
  const [e] = await db
    .select({ campanha_id: tabela.campanha_id })
    .from(tabela)
    .where(and(eq(tabela.id, alvo.id), eq(tabela.status, "Ativo")))
    .limit(1);
  if (!e) return null;

  const daCampanha = e.campanha_id
    ? await atributosVisiveisDaCampanha(db, e.campanha_id)
    : [];
  const ids =
    daCampanha.length > 0
      ? daCampanha
      : await atributosVisiveisDaCategoria(db, alvo.tipo);
  return {
    campanhaId: e.campanha_id ?? null,
    atributosPermitidos: new Set(ids),
  };
}

export async function existeBloqueioAtivo(db: DB, hashes: string[]) {
  const r = await db
    .select({ id: bloqueios.id })
    .from(bloqueios)
    .where(
      and(
        inArray(bloqueios.hash, hashes),
        or(isNull(bloqueios.expira_em), gt(bloqueios.expira_em, new Date())),
      ),
    )
    .limit(1);
  return r.length > 0;
}

export async function contarManifestacoesRecentes(
  db: DB,
  ipHash: string,
  fingerprintHash: string,
  desde: Date,
) {
  const [r] = await db
    .select({ n: count() })
    .from(manifestacoes)
    .where(
      and(
        gte(manifestacoes.criado_em, desde),
        or(
          eq(manifestacoes.ip_hash, ipHash),
          eq(manifestacoes.fingerprint_hash, fingerprintHash),
        ),
      ),
    );
  return r?.n ?? 0;
}

export type NovaManifestacao = {
  alvo: Alvo;
  campanhaId: string | null;
  aprovacao: boolean | null;
  expectativaVitoria: boolean | null;
  perfil: Record<string, unknown>;
  fingerprintHash: string;
  ipHash: string;
  userAgent: string;
  durationMs: number;
  isValid: boolean;
  isBot: boolean;
  plataforma: string;
  itens: { atributoId: string; valor: 1 | -1 }[];
};

/** Grava manifestação + avaliações + contadores/auditoria de forma atômica (D1 batch). */
export async function registrarManifestacao(db: DB, m: NovaManifestacao) {
  const manifestacaoId = crypto.randomUUID();
  const ref = {
    candidato_id: m.alvo.tipo === "candidato" ? m.alvo.id : null,
    orgao_id: m.alvo.tipo === "orgao" ? m.alvo.id : null,
    servico_id: m.alvo.tipo === "servico" ? m.alvo.id : null,
  };
  const auditoria = {
    fingerprint_hash: m.fingerprintHash,
    ip_hash: m.ipHash,
    user_agent: m.userAgent,
    duration_ms: m.durationMs,
    honeypot_triggered: m.isBot,
  };

  const stmts = [
    db.insert(manifestacoes).values({
      id: manifestacaoId,
      ...ref,
      ...auditoria,
      aprovacao: m.aprovacao,
      expectativa_vitoria: m.expectativaVitoria,
      perfil: m.perfil,
      is_valid: m.isValid,
    }),
    db.insert(avaliacoes).values(
      m.itens.map((i) => ({
        manifestacao_id: manifestacaoId,
        ...ref,
        ...auditoria,
        atributo_id: i.atributoId,
        valor: i.valor,
        is_valid: m.isValid,
        device_info: { ua: m.userAgent, platform: m.plataforma },
      })),
    ),
  ] as const;

  const extras = [];
  if (m.isValid) {
    if (m.alvo.tipo === "candidato") {
      extras.push(
        db
          .update(candidatos)
          .set({ total_avaliacoes: sql`${candidatos.total_avaliacoes} + 1` })
          .where(eq(candidatos.id, m.alvo.id)),
      );
    }
    if (m.campanhaId) {
      extras.push(
        db
          .update(campanhas)
          .set({ total_votos: sql`${campanhas.total_votos} + 1` })
          .where(eq(campanhas.id, m.campanhaId)),
      );
    }
  } else {
    extras.push(
      db.insert(auditLogs).values({
        acao: m.isBot ? "BOT_DETECTED" : "SUSPICIOUS_TIMING",
        entidade: "Manifestacao",
        entidade_id: manifestacaoId,
        detalhes: {
          ip_hash: m.ipHash,
          duration_ms: m.durationMs,
          fingerprint: m.fingerprintHash,
        },
      }),
    );
  }

  await db.batch([...stmts, ...extras]);
  return manifestacaoId;
}
