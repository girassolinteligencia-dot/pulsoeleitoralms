/**
 * Resolve a URL pública de uma foto.
 * O banco guarda a chave do objeto no R2 (ex.: "legado/candidatos/cand-123.webp" ou
 * "candidatos/2024/123.webp"); o Worker serve esses objetos em /fotos/<chave>.
 * URLs absolutas e caminhos de /public (iniciados por "/") são mantidos.
 */
export function getFotoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path) || path.startsWith("/")) return path;
  return `/fotos/${path}`;
}
