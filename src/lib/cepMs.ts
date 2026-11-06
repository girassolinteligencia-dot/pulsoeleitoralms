export interface LocalidadeOption {
  bairro: string;
  registros: number;
  proporcao: number;
}

export interface CepMsResponseRecord {
  cidade: string;
  bairro: string | null;
  uf: string;
  logradouro: string | null;
  origem: string;
  localidades: unknown;
  bairro_confianca: number | null;
}

export function normalizeCep(value: string) {
  return value.replace(/\D/g, '');
}

export function isCepMs(value: string) {
  const numeric = Number(value);
  return numeric >= 79000000 && numeric <= 79999999;
}

export function parseLocalidades(value: unknown): LocalidadeOption[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const bairro = typeof record.bairro === 'string' ? record.bairro.trim() : '';
      const registros = typeof record.registros === 'number' ? record.registros : 0;
      const proporcao = typeof record.proporcao === 'number' ? record.proporcao : 0;

      if (!bairro) return null;
      return { bairro, registros, proporcao };
    })
    .filter((item): item is LocalidadeOption => item !== null);
}

export function buildCepResponse(record: CepMsResponseRecord, cache: 'hit' | 'miss') {
  const localidades = parseLocalidades(record.localidades);
  const confiancaBairro = typeof record.bairro_confianca === 'number'
    ? record.bairro_confianca
    : null;
  const bairrosPossiveis = localidades.slice(0, 8);
  const precisaConfirmarBairro = bairrosPossiveis.length > 1 && (confiancaBairro === null || confiancaBairro < 0.8);

  return {
    cidade: record.cidade,
    bairro: record.bairro || bairrosPossiveis[0]?.bairro || '',
    uf: record.uf,
    logradouro: record.logradouro || '',
    origem: record.origem,
    cache,
    confiancaBairro,
    precisaConfirmarBairro,
    bairrosPossiveis,
  };
}
