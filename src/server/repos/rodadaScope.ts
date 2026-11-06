import "server-only";
import { and, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import type { DB } from "@/server/db/client";
import {
  avaliacoes,
  campanhas,
  candidatos,
  manifestacoes,
  rodadasMetodologicas,
} from "@/server/db/schema";

export type RodadaContext = {
  id: string;
  titulo: string;
  tipo: string;
  status: string;
  campanha_id: string | null;
  periodo_inicio: Date | null;
  periodo_fim: Date | null;
  campanha: { nome: string; slug: string } | null;
};

const subtractDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
};
const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};
const normalizeDays = (v: number | undefined) =>
  !v || !Number.isFinite(v) ? 30 : Math.min(3650, Math.max(1, Math.floor(v)));

/**
 * Resolve o recorte (período + campanha) de uma rodada metodológica ou dos últimos N dias.
 * Devolve condições SQL prontas para avaliações, manifestações e candidatos.
 */
export async function resolveRodadaScope(
  db: DB,
  { rodadaId, dias }: { rodadaId?: string | null; dias?: number },
) {
  const normalizedDays = normalizeDays(dias);

  let rodada: RodadaContext | null = null;
  if (rodadaId) {
    const [r] = await db
      .select({
        id: rodadasMetodologicas.id,
        titulo: rodadasMetodologicas.titulo,
        tipo: rodadasMetodologicas.tipo,
        status: rodadasMetodologicas.status,
        campanha_id: rodadasMetodologicas.campanha_id,
        periodo_inicio: rodadasMetodologicas.periodo_inicio,
        periodo_fim: rodadasMetodologicas.periodo_fim,
        campanhaNome: campanhas.nome,
        campanhaSlug: campanhas.slug,
      })
      .from(rodadasMetodologicas)
      .leftJoin(campanhas, eq(campanhas.id, rodadasMetodologicas.campanha_id))
      .where(eq(rodadasMetodologicas.id, rodadaId))
      .limit(1);
    if (r) {
      const { campanhaNome, campanhaSlug, ...rest } = r;
      rodada = {
        ...rest,
        campanha: campanhaNome
          ? { nome: campanhaNome, slug: campanhaSlug ?? "" }
          : null,
      };
    }
  }

  const startDate =
    rodada?.periodo_inicio || subtractDays(new Date(), normalizedDays);
  const endDate = rodada?.periodo_fim ? endOfDay(rodada.periodo_fim) : null;

  // candidatos da campanha da rodada (subconsulta)
  const candidatosDaCampanha = rodada?.campanha_id
    ? db
        .select({ id: candidatos.id })
        .from(candidatos)
        .where(eq(candidatos.campanha_id, rodada.campanha_id))
    : null;

  // Condições do recorte sem filtro de validade (o dossiê conta válidos e inválidos).
  const avaliacaoBase: SQL = and(
    gte(avaliacoes.criado_em, startDate),
    endDate ? lte(avaliacoes.criado_em, endDate) : undefined,
    candidatosDaCampanha ? inArray(avaliacoes.candidato_id, candidatosDaCampanha) : undefined,
  )!;
  const manifestacaoBase: SQL = and(
    gte(manifestacoes.criado_em, startDate),
    endDate ? lte(manifestacoes.criado_em, endDate) : undefined,
    candidatosDaCampanha ? inArray(manifestacoes.candidato_id, candidatosDaCampanha) : undefined,
  )!;
  const avaliacaoWhere: SQL = and(avaliacaoBase, eq(avaliacoes.is_valid, true))!;
  const manifestacaoWhere: SQL = and(manifestacaoBase, eq(manifestacoes.is_valid, true))!;

  const candidatoWhere: SQL = and(
    eq(candidatos.status, "Ativo"),
    rodada?.campanha_id
      ? eq(candidatos.campanha_id, rodada.campanha_id)
      : undefined,
  )!;

  return {
    rodada,
    dias: normalizedDays,
    startDate,
    endDate,
    avaliacaoBase,
    manifestacaoBase,
    avaliacaoWhere,
    manifestacaoWhere,
    candidatoWhere,
  };
}
