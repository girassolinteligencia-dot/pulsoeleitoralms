import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type {
  D1Database,
  KVNamespace,
  R2Bucket,
} from "@cloudflare/workers-types";

/** Bindings declarados em wrangler.jsonc. */
export type Bindings = {
  DB: D1Database;
  FOTOS: R2Bucket;
  KV: KVNamespace;
};

export function bindings(): Bindings {
  return getCloudflareContext().env as unknown as Bindings;
}

export async function bindingsAsync(): Promise<Bindings> {
  return (await getCloudflareContext({ async: true }))
    .env as unknown as Bindings;
}
