export function normalizeSearch(str: string): string {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function buildSearchOR(
  search: string,
  fields: string[]
): { [key: string]: { contains: string; mode: 'insensitive' } }[] {
  const normalized = normalizeSearch(search);
  const terms = Array.from(new Set([search, normalized])).filter(Boolean);
  return fields.flatMap(field =>
    terms.map(term => ({ [field]: { contains: term, mode: 'insensitive' as const } }))
  );
}
