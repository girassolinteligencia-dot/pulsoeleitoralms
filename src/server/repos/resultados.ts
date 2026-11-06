import "server-only";
import { and, asc, count, desc, eq, gte, inArray, isNotNull, sum } from "drizzle-orm";
import type { DB } from "@/server/db/client";
import {
  atributos,
  avaliacoes,
  campanhaAtributos,
  candidatos,
  manifestacoes,
  orgaosPublicos,
  resumoAlvo,
  servicosPublicos,
} from "@/server/db/schema";
import type { Alvo } from "./avaliacoes";

const colunaAlvo = {
  candidato: { m: manifestacoes.candidato_id, a: avaliacoes.candidato_id },
  orgao: { m: manifestacoes.orgao_id, a: avaliacoes.orgao_id },
  servico: { m: manifestacoes.servico_id, a: avaliacoes.servico_id },
} as const;

export type ManifestacaoComAvaliacoes = {
  id: string;
  aprovacao: boolean | null;
  expectativa_vitoria: boolean | null;
  perfil: Record<string, unknown> | null;
  criado_em: Date;
  avaliacoes: {
    atributo_id: string;
    valor: number;
    atributo: { nome: string };
  }[];
};

/** Manifestações válidas do alvo (mais recentes primeiro) com as avaliações válidas aninhadas. */
export async function manifestacoesComAvaliacoes(
  db: DB,
  alvo: Alvo,
): Promise<ManifestacaoComAvaliacoes[]> {
  const col = colunaAlvo[alvo.tipo];
  const [ms, avs] = await Promise.all([
    db
      .select({
        id: manifestacoes.id,
        aprovacao: manifestacoes.aprovacao,
        expectativa_vitoria: manifestacoes.expectativa_vitoria,
        perfil: manifestacoes.perfil,
        criado_em: manifestacoes.criado_em,
      })
      .from(manifestacoes)
      .where(and(eq(col.m, alvo.id), eq(manifestacoes.is_valid, true)))
      .orderBy(desc(manifestacoes.criado_em)),
    db
      .select({
        manifestacao_id: avaliacoes.manifestacao_id,
        atributo_id: avaliacoes.atributo_id,
        valor: avaliacoes.valor,
        nome: atributos.nome,
      })
      .from(avaliacoes)
      .innerJoin(atributos, eq(atributos.id, avaliacoes.atributo_id))
      .where(and(eq(col.a, alvo.id), eq(avaliacoes.is_valid, true))),
  ]);

  const porManifestacao = new Map<
    string,
    ManifestacaoComAvaliacoes["avaliacoes"]
  >();
  for (const a of avs) {
    if (!a.manifestacao_id) continue;
    const list = porManifestacao.get(a.manifestacao_id) ?? [];
    list.push({
      atributo_id: a.atributo_id,
      valor: a.valor,
      atributo: { nome: a.nome },
    });
    porManifestacao.set(a.manifestacao_id, list);
  }
  return ms.map((m) => ({ ...m, avaliacoes: porManifestacao.get(m.id) ?? [] }));
}

/** Soma e contagem de avaliações válidas por atributo, com o nome do atributo. */
export async function somaPorAtributo(db: DB, alvo: Alvo) {
  const col = colunaAlvo[alvo.tipo];
  const rows = await db
    .select({
      atributo_id: avaliacoes.atributo_id,
      nome: atributos.nome,
      soma: sum(avaliacoes.valor).mapWith(Number),
      total: count(),
    })
    .from(avaliacoes)
    .innerJoin(atributos, eq(atributos.id, avaliacoes.atributo_id))
    .where(and(eq(col.a, alvo.id), eq(avaliacoes.is_valid, true)))
    .groupBy(avaliacoes.atributo_id, atributos.nome);
  return rows;
}

/** Atributos da campanha do candidato (todos, como no comportamento legado), ou null se não existir. */
export async function atributosDaCampanhaDoCandidato(
  db: DB,
  candidatoId: string,
) {
  const [c] = await db
    .select({ campanha_id: candidatos.campanha_id, cargo: candidatos.cargo })
    .from(candidatos)
    .where(eq(candidatos.id, candidatoId))
    .limit(1);
  if (!c) return null;
  const attrs = await db
    .select({
      atributo_id: campanhaAtributos.atributo_id,
      nome: atributos.nome,
    })
    .from(campanhaAtributos)
    .innerJoin(atributos, eq(atributos.id, campanhaAtributos.atributo_id))
    .where(eq(campanhaAtributos.campanha_id, c.campanha_id));
  return { cargo: c.cargo, atributos: attrs };
}

/**
 * Saldo (soma de valores) e total de avaliações válidas por candidato do mesmo cargo.
 * Lê resumo_alvo (recalculado pelo Cron a cada 15 min) em vez de varrer todas as
 * avaliações do cargo a cada requisição.
 */
export async function rankingPorCargo(db: DB, cargo: string) {
  if (!cargo) return [];
  return db
    .select({
      candidato_id: resumoAlvo.alvo_id,
      soma: resumoAlvo.saldo_atributos,
      total: resumoAlvo.total_avaliacoes,
    })
    .from(resumoAlvo)
    .innerJoin(candidatos, eq(candidatos.id, resumoAlvo.alvo_id))
    .where(and(eq(resumoAlvo.alvo_tipo, "candidato"), eq(candidatos.cargo, cargo)));
}

export async function entidadeInfo(
  db: DB,
  tipo: "orgao" | "servico",
  id: string,
) {
  const t = tipo === "orgao" ? orgaosPublicos : servicosPublicos;
  const [r] = await db
    .select({ tipo: t.tipo, nome: t.nome })
    .from(t)
    .where(eq(t.id, id))
    .limit(1);
  return r ?? null;
}

export async function nomesAtributos(db: DB, ids: string[]) {
  if (ids.length === 0) return new Map<string, string>();
  const rows = await db
    .select({ id: atributos.id, nome: atributos.nome })
    .from(atributos)
    .where(inArray(atributos.id, ids));
  return new Map(rows.map((r) => [r.id, r.nome]));
}

// ------------------------------------------------------- API pública (token)
export type CategoriaFiltro = "todos" | "politico" | "orgao_publico" | "servico_publico";

export async function idsAtributosPorNome(db: DB, nomes: string[]) {
  const rows = await db
    .select({ id: atributos.id })
    .from(atributos)
    .where(and(inArray(atributos.nome, nomes), eq(atributos.visivel, true)));
  return rows.map((r) => r.id);
}

/** Agrega avaliações válidas desde `desde` para a API pública de resultados. */
export async function dadosApiPublica(
  db: DB,
  opts: { desde: Date; categoria: CategoriaFiltro; atributoIds: string[] | null; limite: number },
) {
  const base = [
    gte(avaliacoes.criado_em, opts.desde),
    eq(avaliacoes.is_valid, true),
    opts.atributoIds ? inArray(avaliacoes.atributo_id, opts.atributoIds) : undefined,
  ];
  const catCol =
    opts.categoria === "politico" ? avaliacoes.candidato_id
    : opts.categoria === "orgao_publico" ? avaliacoes.orgao_id
    : opts.categoria === "servico_publico" ? avaliacoes.servico_id
    : null;
  const whereCat = and(...base, catCol ? isNotNull(catCol) : undefined);

  type ColAlvo = typeof avaliacoes.candidato_id | typeof avaliacoes.orgao_id | typeof avaliacoes.servico_id;
  const ranking = async (col: ColAlvo) =>
    db
      .select({ id: col, soma: sum(avaliacoes.valor).mapWith(Number), total: count() })
      .from(avaliacoes)
      .where(and(...base, isNotNull(col)))
      .groupBy(col)
      .orderBy(desc(count()))
      .limit(opts.limite);

  const quer = (c: CategoriaFiltro) => opts.categoria === "todos" || opts.categoria === c;
  const [rankCand, rankOrg, rankSvc] = await Promise.all([
    quer("politico") ? ranking(avaliacoes.candidato_id) : [],
    quer("orgao_publico") ? ranking(avaliacoes.orgao_id) : [],
    quer("servico_publico") ? ranking(avaliacoes.servico_id) : [],
  ]);

  const ids = (r: { id: string | null }[]) => r.map((x) => x.id).filter((x): x is string => !!x);
  const [cands, orgs, svcs, temas, [totAv], [totMan], disponiveis] = await Promise.all([
    rankCand.length
      ? db
          .select({ id: candidatos.id, nome: candidatos.nome, cargo: candidatos.cargo, partido: candidatos.partido, foto_url: candidatos.foto_url })
          .from(candidatos)
          .where(inArray(candidatos.id, ids(rankCand)))
      : [],
    rankOrg.length
      ? db
          .select({ id: orgaosPublicos.id, nome: orgaosPublicos.nome, tipo: orgaosPublicos.tipo, cidade: orgaosPublicos.cidade, foto_url: orgaosPublicos.foto_url })
          .from(orgaosPublicos)
          .where(inArray(orgaosPublicos.id, ids(rankOrg)))
      : [],
    rankSvc.length
      ? db
          .select({ id: servicosPublicos.id, nome: servicosPublicos.nome, tipo: servicosPublicos.tipo, cidade: servicosPublicos.cidade, foto_url: servicosPublicos.foto_url })
          .from(servicosPublicos)
          .where(inArray(servicosPublicos.id, ids(rankSvc)))
      : [],
    db
      .select({ nome: atributos.nome, polaridade: atributos.polaridade, total: count() })
      .from(avaliacoes)
      .innerJoin(atributos, eq(atributos.id, avaliacoes.atributo_id))
      .where(whereCat)
      .groupBy(avaliacoes.atributo_id, atributos.nome, atributos.polaridade)
      .orderBy(desc(count()))
      .limit(10),
    db.select({ n: count() }).from(avaliacoes).where(whereCat),
    db
      .select({ n: count() })
      .from(manifestacoes)
      .where(and(gte(manifestacoes.criado_em, opts.desde), eq(manifestacoes.is_valid, true))),
    db
      .select({ nome: atributos.nome, polaridade: atributos.polaridade })
      .from(atributos)
      .where(eq(atributos.visivel, true))
      .orderBy(asc(atributos.nome)),
  ]);

  return {
    rankCand, rankOrg, rankSvc, cands, orgs, svcs, temas,
    totalAvaliacoes: totAv?.n ?? 0,
    totalParticipantes: totMan?.n ?? 0,
    disponiveis,
  };
}
