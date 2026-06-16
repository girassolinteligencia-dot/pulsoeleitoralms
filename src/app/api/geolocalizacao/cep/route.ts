import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildCepResponse, type CepMsResponseRecord } from '@/lib/cepMs';

interface NearbyCepRow extends CepMsResponseRecord {
  cep: string;
  distancia_km: number | null;
}

function parseCoordinate(value: string | null) {
  if (!value) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function isLikelyInMs(latitude: number, longitude: number) {
  return latitude >= -24.5 && latitude <= -17 && longitude >= -58.5 && longitude <= -50.5;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const latitude = parseCoordinate(url.searchParams.get('lat'));
  const longitude = parseCoordinate(url.searchParams.get('lon'));

  if (latitude === null || longitude === null) {
    return NextResponse.json({ error: 'Coordenadas inválidas.' }, { status: 400 });
  }

  if (!isLikelyInMs(latitude, longitude)) {
    return NextResponse.json({ error: 'Localização fora de Mato Grosso do Sul.' }, { status: 400 });
  }

  try {
    const rows = await prisma.$queryRaw<NearbyCepRow[]>`
      SELECT
        cep,
        uf,
        cidade,
        bairro,
        logradouro,
        origem,
        localidades,
        bairro_confianca,
        (
          111.045 * sqrt(
            power(latitude - ${latitude}, 2) +
            power((longitude - ${longitude}) * cos(radians(${latitude})), 2)
          )
        )::float AS distancia_km
      FROM ceps_ms
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
      ORDER BY
        power(latitude - ${latitude}, 2) +
        power(longitude - ${longitude}, 2)
      LIMIT 1
    `;

    const nearest = rows[0];
    if (!nearest) {
      return NextResponse.json({ error: 'Não foi possível localizar um CEP próximo.' }, { status: 404 });
    }

    return NextResponse.json(
      {
        ...buildCepResponse(nearest, 'hit'),
        cep: nearest.cep,
        origem: nearest.origem === 'ibge_enderecos' ? 'geo_ibge_enderecos' : `geo_${nearest.origem}`,
        distanciaKm: nearest.distancia_km,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=3600',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao localizar CEP por geolocalização:', error);
    return NextResponse.json({ error: 'Geolocalização indisponível.' }, { status: 502 });
  }
}
