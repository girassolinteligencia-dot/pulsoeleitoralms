import "server-only";
import { and, asc, count, desc, eq, inArray, like } from "drizzle-orm";
import type { DB } from "@/server/db/client";
import {
  atributos,
  campanhaAtributos,
  campanhas,
  candidatos,
  orgaosPublicos,
  servicosPublicos,
} from "@/server/db/schema";
import { getFotoUrl } from "@/lib/fotoUrl";
import { likePattern } from "@/lib/normalize-search";
import { getPublicScopeConfig, publicCandidateConditions } from "./scope";

type AtributoPub = { id: string; nome: string; polaridade: number };
type AtributosWrap = { atributos: { atributo: AtributoPub }[] };

/** Atributos visíveis por campanha, no formato legado { atributos: [{ atributo }] }. */
async function atributosPorCampanha(db: DB, campanhaIds: string[]) {
  const map = new Map<string, AtributosWrap>();
  const ids = [...new Set(campanhaIds)];
  if (ids.length === 0) return map;
  const rows = await db
    .select({
      campanha_id: campanhaAtributos.campanha_id,
      id: atributos.id,
      nome: atributos.nome,
      polaridade: atributos.polaridade,
    })
    .from(campanhaAtributos)
    .innerJoin(atributos, eq(atributos.id, campanhaAtributos.atributo_id))
    .where(
      and(
        inArray(campanhaAtributos.campanha_id, ids),
        eq(atributos.visivel, true),
      ),
    );
  for (const r of rows) {
    const w = map.get(r.campanha_id) ?? { atributos: [] };
    w.atributos.push({
      atributo: { id: r.id, nome: r.nome, polaridade: r.polaridade },
    });
    map.set(r.campanha_id, w);
  }
  return map;
}

export async function listarCandidatosPublicos(db: DB, search: string) {
  const scope = await getPublicScopeConfig(db);
  const rows = await db
    .select({
      id: candidatos.id,
      nome: candidatos.nome,
      partido: candidatos.partido,
      cargo: candidatos.cargo,
      cidade: candidatos.cidade,
      foto_url: candidatos.foto_url,
      status_verificacao: candidatos.status_verificacao,
      campanha_id: candidatos.campanha_id,
    })
    .from(candidatos)
    .innerJoin(campanhas, eq(campanhas.id, candidatos.campanha_id))
    .where(
      publicCandidateConditions(
        scope,
        search ? like(candidatos.busca, likePattern(search)) : undefined,
      ),
    )
    .orderBy(asc(candidatos.nome))
    .limit(50);

  const attrs = await atributosPorCampanha(
    db,
    rows.map((r) => r.campanha_id),
  );
  return rows.map(({ campanha_id, ...c }) => {
    const idx = c.nome.indexOf("(");
    const nomeUrna = idx > 0 ? c.nome.slice(0, idx).trim() : c.nome;
    return {
      ...c,
      foto_url: getFotoUrl(c.foto_url),
      campanha: attrs.get(campanha_id) ?? { atributos: [] },
      nomeExibido: c.status_verificacao ? c.nome : nomeUrna,
    };
  });
}

/** Órgãos ou serviços ativos com atributos (fallback: atributos globais da categoria). */
export async function listarEntidadesPublicas(
  db: DB,
  tipo: "orgao" | "servico",
  search: string,
) {
  const t = tipo === "orgao" ? orgaosPublicos : servicosPublicos;
  const [rows, globais] = await Promise.all([
    db
      .select()
      .from(t)
      .where(
        and(
          eq(t.status, "Ativo"),
          search ? like(t.busca, likePattern(search)) : undefined,
        ),
      )
      .orderBy(asc(t.cidade), asc(t.nome))
      .limit(50),
    db
      .select({
        id: atributos.id,
        nome: atributos.nome,
        polaridade: atributos.polaridade,
      })
      .from(atributos)
      .where(and(eq(atributos.visivel, true), eq(atributos.categoria, tipo)))
      .orderBy(desc(atributos.polaridade), asc(atributos.nome)),
  ]);

  const attrs = await atributosPorCampanha(
    db,
    rows.map((r) => r.campanha_id).filter((x): x is string => !!x),
  );
  const fallback: AtributosWrap = {
    atributos: globais.map((a) => ({ atributo: a })),
  };
  return rows.map(({ busca: _busca, ...e }) => {
    const daCampanha = e.campanha_id ? attrs.get(e.campanha_id) : undefined;
    return {
      ...e,
      foto_url: getFotoUrl(e.foto_url),
      campanha:
        daCampanha && daCampanha.atributos.length > 0 ? daCampanha : fallback,
    };
  });
}

export async function destaquesPorIds(
  db: DB,
  tipo: "orgao" | "servico",
  ids: string[],
) {
  if (ids.length === 0) return [];
  const t = tipo === "orgao" ? orgaosPublicos : servicosPublicos;
  const rows = await db
    .select({
      id: t.id,
      nome: t.nome,
      tipo: t.tipo,
      cidade: t.cidade,
      foto_url: t.foto_url,
    })
    .from(t)
    .where(and(inArray(t.id, ids), eq(t.status, "Ativo")));
  // preserva a ordem definida pelo admin
  return ids.flatMap((id) => {
    const r = rows.find((x) => x.id === id);
    return r ? [{ ...r, foto_url: getFotoUrl(r.foto_url) }] : [];
  });
}

export async function categoriasDisponiveis(db: DB) {
  const [[c], [o], [s]] = await Promise.all([
    db
      .select({ n: count() })
      .from(candidatos)
      .where(eq(candidatos.status, "Ativo")),
    db
      .select({ n: count() })
      .from(orgaosPublicos)
      .where(eq(orgaosPublicos.status, "Ativo")),
    db
      .select({ n: count() })
      .from(servicosPublicos)
      .where(eq(servicosPublicos.status, "Ativo")),
  ]);
  const categorias: string[] = [];
  if (c.n > 0) categorias.push("Político");
  if (o.n > 0) categorias.push("Órgão Público");
  if (s.n > 0) categorias.push("Serviço Público");
  return categorias;
}
