import "server-only";
import { inArray, like, or } from "drizzle-orm";
import type { DB } from "@/server/db/client";
import { parametrosPlataforma } from "@/server/db/schema";

export async function getParametros(db: DB, chaves: string[]) {
  if (chaves.length === 0) return new Map<string, unknown>();
  const rows = await db
    .select({
      chave: parametrosPlataforma.chave,
      valor: parametrosPlataforma.valor,
    })
    .from(parametrosPlataforma)
    .where(inArray(parametrosPlataforma.chave, chaves));
  return new Map(rows.map((r) => [r.chave, r.valor as unknown]));
}

export async function getParametrosPorPrefixo(db: DB, prefixos: string[]) {
  const rows = await db
    .select({
      chave: parametrosPlataforma.chave,
      valor: parametrosPlataforma.valor,
    })
    .from(parametrosPlataforma)
    .where(
      or(...prefixos.map((p) => like(parametrosPlataforma.chave, `${p}%`))),
    );
  return new Map(rows.map((r) => [r.chave, r.valor as unknown]));
}

export const asString = (v: unknown, fallback = "") =>
  typeof v === "string" && v ? v : fallback;
export const asStringArray = (v: unknown) =>
  Array.isArray(v) ? v.filter((i): i is string => typeof i === "string") : [];
