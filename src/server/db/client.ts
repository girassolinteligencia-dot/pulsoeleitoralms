import "server-only";
import { drizzle } from "drizzle-orm/d1";
import { bindings, bindingsAsync } from "@/server/cf";
import * as schema from "./schema";

function createDb(d1: Parameters<typeof drizzle>[0]) {
  return drizzle(d1, { schema });
}

export type DB = ReturnType<typeof createDb>;

/** Cliente Drizzle ligado ao binding D1 da requisição atual. */
export function getDb(): DB {
  return createDb(bindings().DB as unknown as Parameters<typeof drizzle>[0]);
}

/** Versão assíncrona para uso em páginas estáticas/ISR. */
export async function getDbAsync(): Promise<DB> {
  return createDb(
    (await bindingsAsync()).DB as unknown as Parameters<typeof drizzle>[0],
  );
}

export { schema };
