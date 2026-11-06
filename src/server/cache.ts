import "server-only";

/** Prefixo versionado: mudar o formato de uma resposta = subir a versão. */
const VERSAO = "v1";

/** Resposta JSON serializável para guardar em cache. */
export type RespostaCacheavel = { status: number; body: unknown };

type CacheWorkers = { default: Cache };

function cacheDoWorker(): Cache | null {
  // Disponível no runtime do Workers; ausente no `next dev` em Node.
  const c = (globalThis as unknown as { caches?: CacheWorkers }).caches;
  return c?.default ?? null;
}

/**
 * Cache de respostas JSON públicas e agregadas (sem dados pessoais) na Cache API
 * do Workers: sem custo e sem limite de escrita, local a cada data center.
 * Falhas no cache nunca derrubam a rota: caem direto no cálculo.
 */
export async function comCache<T>(
  chave: string,
  ttlSegundos: number,
  calcular: () => Promise<T>,
  deveGuardar: (valor: T) => boolean = () => true,
): Promise<{ valor: T; hit: boolean }> {
  const cache = cacheDoWorker();
  // URL sintética: a chave só precisa ser única e estável.
  const req = new Request(
    `https://cache.pulsoms.internal/${VERSAO}/${encodeURIComponent(chave)}`,
  );

  if (cache) {
    try {
      const salvo = await cache.match(req);
      if (salvo) return { valor: (await salvo.json()) as T, hit: true };
    } catch (err) {
      console.error("[cache] leitura falhou:", err);
    }
  }

  const valor = await calcular();
  if (cache && deveGuardar(valor)) {
    try {
      await cache.put(
        req,
        new Response(JSON.stringify(valor), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${ttlSegundos}`,
          },
        }),
      );
    } catch (err) {
      console.error("[cache] escrita falhou:", err);
    }
  }
  return { valor, hit: false };
}
