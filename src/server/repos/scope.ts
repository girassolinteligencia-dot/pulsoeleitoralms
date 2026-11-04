import "server-only";
import { and, eq, inArray, type SQL } from "drizzle-orm";
import type { DB } from "@/server/db/client";
import {
  campanhas,
  candidatos,
  parametrosPlataforma,
} from "@/server/db/schema";

export type PublicScopeMode = "all_active" | "selected_campaigns";
export type PublicScopeConfig = {
  mode: PublicScopeMode;
  anosAtivos: number[];
  campanhasAtivas: string[];
};

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((i): i is string => typeof i === "string" && i.length > 0)
    : [];
const asNumberArray = (v: unknown): number[] =>
  Array.isArray(v)
    ? v.map(Number).filter((i) => Number.isInteger(i) && i >= 1900 && i <= 2100)
    : [];

export async function getPublicScopeConfig(db: DB): Promise<PublicScopeConfig> {
  const rows = await db
    .select({
      chave: parametrosPlataforma.chave,
      valor: parametrosPlataforma.valor,
    })
    .from(parametrosPlataforma)
    .where(
      inArray(parametrosPlataforma.chave, [
        "public_scope_mode",
        "public_anos_ativos",
        "public_campanhas_ativas",
      ]),
    );
  const values = new Map(rows.map((r) => [r.chave, r.valor]));
  return {
    mode:
      values.get("public_scope_mode") === "selected_campaigns"
        ? "selected_campaigns"
        : "all_active",
    anosAtivos: asNumberArray(values.get("public_anos_ativos")),
    campanhasAtivas: asStringArray(values.get("public_campanhas_ativas")),
  };
}

/**
 * Condições de candidato visível publicamente.
 * Exige join com `campanhas` (innerJoin(campanhas, eq(campanhas.id, candidatos.campanha_id))).
 */
export function publicCandidateConditions(
  config: PublicScopeConfig,
  ...extra: (SQL | undefined)[]
) {
  const conds: (SQL | undefined)[] = [
    eq(candidatos.status, "Ativo"),
    eq(campanhas.status, "ativo"),
  ];
  if (config.anosAtivos.length > 0)
    conds.push(inArray(candidatos.ano_eleicao, config.anosAtivos));
  if (config.mode === "selected_campaigns") {
    conds.push(
      inArray(
        candidatos.campanha_id,
        config.campanhasAtivas.length ? config.campanhasAtivas : ["__none__"],
      ),
    );
  }
  return and(...conds, ...extra);
}
