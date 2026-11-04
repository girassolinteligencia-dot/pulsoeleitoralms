/** Minúsculas, sem acentos e espaços colapsados — usado na coluna `busca` e nas consultas. */
export function normalizeSearch(str: string): string {
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Monta o texto indexável de uma entidade a partir dos campos relevantes. */
export function buildBusca(...parts: (string | null | undefined)[]): string {
  return normalizeSearch(parts.filter(Boolean).join(" "));
}

/** Padrão LIKE para busca por termo normalizado (curingas % e _ do usuário são removidos). */
export function likePattern(search: string): string {
  return `%${normalizeSearch(search).replace(/[%_]/g, "")}%`;
}
