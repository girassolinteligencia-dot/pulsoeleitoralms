import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildCepResponse, isCepMs, normalizeCep } from '@/lib/cepMs';

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
