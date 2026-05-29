import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type SegmentData = {
  params: Promise<{ cep: string }>;
};

interface BrasilApiCepResponse {
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  service?: string;
}

type CepMsRecord = NonNullable<Awaited<ReturnType<typeof prisma.cepMs.findUnique>>>;

interface LocalidadeOption {
  bairro: string;
  registros: number;
  proporcao: number;
}

function normalizeCep(value: string) {
  return value.replace(/\D/g, '');
}

function isCepMs(value: string) {
  const numeric = Number(value);
  return numeric >= 79000000 && numeric <= 79999999;
}

function parseLocalidades(value: unknown): LocalidadeOption[] {
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

function buildCepResponse(record: CepMsRecord, cache: 'hit' | 'miss') {
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

export async function GET(_req: Request, segmentData: SegmentData) {
  const { cep } = await segmentData.params;
  const normalizedCep = normalizeCep(cep);

  if (!/^\d{8}$/.test(normalizedCep)) {
    return NextResponse.json({ error: 'CEP inválido.' }, { status: 400 });
  }

  if (!isCepMs(normalizedCep)) {
    return NextResponse.json({ error: 'A plataforma aceita apenas CEPs de Mato Grosso do Sul.' }, { status: 400 });
  }

  const cached = await prisma.cepMs.findUnique({
    where: {
      cep: normalizedCep,
    },
  });

  if (cached) {
    return NextResponse.json(
      buildCepResponse(cached, 'hit'),
      {
        headers: {
          'Cache-Control': 'private, max-age=86400',
        },
      }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${normalizedCep}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null) as BrasilApiCepResponse | null;

    if (res.status === 404) {
      return NextResponse.json({ error: 'CEP não encontrado.' }, { status: 404 });
    }

    if (!res.ok || !data) {
      return NextResponse.json({ error: 'Não foi possível consultar o CEP.' }, { status: 502 });
    }

    if (data.state !== 'MS') {
      return NextResponse.json({ error: 'CEP localizado fora de Mato Grosso do Sul.' }, { status: 400 });
    }

    const saved = await prisma.cepMs.upsert({
      where: {
        cep: normalizedCep,
      },
      create: {
        cep: normalizedCep,
        uf: data.state,
        cidade: data.city || '',
        bairro: data.neighborhood || null,
        logradouro: data.street || null,
        origem: 'brasilapi',
        localidades: data.neighborhood
          ? [{ bairro: data.neighborhood, registros: 1, proporcao: 1 }]
          : [],
        bairro_confianca: data.neighborhood ? 1 : null,
        total_registros: data.neighborhood ? 1 : 0,
        localidades_count: data.neighborhood ? 1 : 0,
        logradouros_count: data.street ? 1 : 0,
      },
      update: {
        uf: data.state,
        cidade: data.city || '',
        bairro: data.neighborhood || null,
        logradouro: data.street || null,
        origem: 'brasilapi',
        localidades: data.neighborhood
          ? [{ bairro: data.neighborhood, registros: 1, proporcao: 1 }]
          : [],
        bairro_confianca: data.neighborhood ? 1 : null,
        total_registros: data.neighborhood ? 1 : 0,
        localidades_count: data.neighborhood ? 1 : 0,
        logradouros_count: data.street ? 1 : 0,
      },
    });

    return NextResponse.json(
      buildCepResponse(saved, 'miss'),
      {
        headers: {
          'Cache-Control': 'private, max-age=86400',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao consultar CEP:', error);
    return NextResponse.json({ error: 'Consulta de CEP indisponível.' }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
