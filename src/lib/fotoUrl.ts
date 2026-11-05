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

/**
 * Valida um foto_url enviado em cadastro manual: aceita vazio, chave de imagem do R2
 * (pastas conhecidas) ou caminho de imagem em /public. URLs externas e travessias
 * de diretório são recusadas. Retorna o valor normalizado, null (vazio) ou undefined (inválido).
 */
export function sanitizeFotoUrl(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (!v) return null;
  if (v.includes("..") || v.includes("\\")) return undefined;
  const ext = /\.(webp|jpe?g|png)$/i;
  if (/^(legado|candidatos|orgaos|servicos)\/[\w./-]+$/.test(v) && ext.test(v))
    return v;
  // caminho em /public: uma única barra inicial (//host seria URL externa)
  if (/^\/[\w-][\w./-]*$/.test(v) && !v.includes("//") && ext.test(v)) return v;
  return undefined;
}
