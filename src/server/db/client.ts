import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type DB = ReturnType<typeof createDb>;

function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

/** Cliente Drizzle ligado ao binding D1 da requisição atual. */
export function getDb(): DB {
  const { env } = getCloudflareContext();
  return createDb((env as { DB: D1Database }).DB);
}

/** Versão assíncrona para uso em rotas estáticas/ISR. */
export async function getDbAsync(): Promise<DB> {
  const { env } = await getCloudflareContext({ async: true });
  return createDb((env as { DB: D1Database }).DB);
}

export { schema };
