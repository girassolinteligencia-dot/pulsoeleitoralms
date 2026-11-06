import "server-only";
import { and, between, eq, isNotNull } from "drizzle-orm";
import type { DB } from "@/server/db/client";
import { cepsMs } from "@/server/db/schema";

export async function buscarCep(db: DB, cep: string) {
  const [r] = await db.select().from(cepsMs).where(eq(cepsMs.cep, cep)).limit(1);
  return r ?? null;
}

export type CepBrasilApi = { state: string; city?: string; neighborhood?: string; street?: string };

export async function salvarCepBrasilApi(db: DB, cep: string, d: CepBrasilApi) {
  const values = {
    uf: d.state,
    cidade: d.city || "",
    bairro: d.neighborhood || null,
    logradouro: d.street || null,
    origem: "brasilapi",
    localidades: d.neighborhood ? [{ bairro: d.neighborhood, registros: 1, proporcao: 1 }] : [],
    bairro_confianca: d.neighborhood ? 1 : null,
    total_registros: d.neighborhood ? 1 : 0,
    localidades_count: d.neighborhood ? 1 : 0,
    logradouros_count: d.street ? 1 : 0,
  };
  const [saved] = await db
    .insert(cepsMs)
    .values({ cep, ...values })
    .onConflictDoUpdate({ target: cepsMs.cep, set: { ...values, atualizado_em: new Date() } })
    .returning();
  return saved;
}

const distanciaKm = (lat1: number, lon1: number, lat2: number, lon2: number) =>
  111.045 * Math.sqrt((lat2 - lat1) ** 2 + ((lon2 - lon1) * Math.cos((lat1 * Math.PI) / 180)) ** 2);

/** CEP mais próximo: busca em faixas crescentes de lat/lng (usa o índice) e ordena em JS. */
export async function cepMaisProximo(db: DB, lat: number, lon: number) {
  for (const raio of [0.02, 0.08, 0.3, 1.5, 8]) {
    const rows = await db
      .select()
      .from(cepsMs)
      .where(
        and(
          isNotNull(cepsMs.latitude),
          isNotNull(cepsMs.longitude),
          between(cepsMs.latitude, lat - raio, lat + raio),
          between(cepsMs.longitude, lon - raio, lon + raio),
        ),
      )
      .limit(2000);
    if (rows.length === 0) continue;
    let best = rows[0];
    let bestD = Infinity;
    for (const r of rows) {
      const d = distanciaKm(lat, lon, r.latitude!, r.longitude!);
      if (d < bestD) [best, bestD] = [r, d];
    }
    return { ...best, distancia_km: bestD };
  }
  return null;
}
