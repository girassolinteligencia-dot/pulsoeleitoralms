import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Cliente com permissão de escrita no Storage (server-side only). */
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada.');
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * Resolve a URL pública de uma foto.
 * O banco armazena apenas o caminho relativo, ex: "candidatos/ID.webp".
 * Caminhos legados com "/" inicial também são tratados.
 */
export function getFotoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Já é URL completa
  if (path.startsWith('http')) return path;
  // Remove barra inicial se houver (legado: "/candidatos/ID.webp")
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${supabaseUrl}/storage/v1/object/public/${clean}`;
}
