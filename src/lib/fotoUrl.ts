const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Resolve a URL publica de uma foto.
 * O banco armazena apenas o caminho relativo, ex: "candidatos/ID.webp".
 * Caminhos legados com "/" inicial tambem sao tratados.
 */
export function getFotoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  const clean = path.startsWith('/') ? path.slice(1) : path;
  if (!supabaseUrl) return `/${clean}`;

  return `${supabaseUrl}/storage/v1/object/public/${clean}`;
}
