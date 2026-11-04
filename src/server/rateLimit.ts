import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Rate limit global usando o binding nativo do Workers (configurado em wrangler.jsonc).
// Cada binding tem limite/período fixos; escolha o binding pelo caso de uso.
export type RateLimitBinding = "RL_SESSAO" | "RL_ENVIO" | "RL_PUBLICO";

type Limiter = { limit(opts: { key: string }): Promise<{ success: boolean }> };

export async function checkRateLimit(binding: RateLimitBinding, key: string) {
  let limiter: Limiter | undefined;
  try {
    const { env } = getCloudflareContext();
    limiter = (env as unknown as Record<string, Limiter | undefined>)[binding];
  } catch {
    limiter = undefined;
  }
  // Sem binding (ex.: next dev puro) não bloqueia.
  if (!limiter) return { allowed: true, retryAfter: 0 };
  const { success } = await limiter.limit({ key });
  return { allowed: success, retryAfter: success ? 0 : 60 };
}
