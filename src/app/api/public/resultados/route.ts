import { NextRequest, NextResponse } from 'next/server';
import { and, eq, like } from 'drizzle-orm';
import { getDb, type DB } from '@/server/db/client';
import { parametrosPlataforma } from '@/server/db/schema';
import { dadosApiPublica, idsAtributosPorNome, type CategoriaFiltro } from '@/server/repos/resultados';
import { getFotoUrl } from '@/lib/fotoUrl';
import { verifyApiTokenHash } from '@/lib/apiTokens';

const CATEGORIAS: CategoriaFiltro[] = ['todos', 'politico', 'orgao_publico', 'servico_publico'];

function getAllowedOrigins() {
  return new Set(
    [
      'https://pulsoms.ia.br',
      'https://www.pulsoms.ia.br',
      process.env.NEXT_PUBLIC_APP_URL,
      ...(process.env.PUBLIC_API_ALLOWED_ORIGINS || '').split(','),
    ]
      .map(origin => origin?.trim())
      .filter((origin): origin is string => Boolean(origin))
  );
}

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin');
  const headers: Record<string, string> = { Vary: 'Origin' };

  if (origin && getAllowedOrigins().has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

function jsonWithCors(req: NextRequest, body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...getCorsHeaders(req),
      ...(init?.headers || {}),
    },
  });
}

function parseBoundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = value ? parseInt(value, 10) : fallback;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

async function validateToken(db: DB, token: string): Promise<boolean> {
  const allTokens = await db
    .select({ valor: parametrosPlataforma.valor })
    .from(parametrosPlataforma)
    .where(and(like(parametrosPlataforma.chave, 'api_token_%'), eq(parametrosPlataforma.grupo, 'api_tokens')));

  return allTokens.some(p => {
    const v = p.valor as Record<string, unknown>;
    return (
      v?.ativo === true &&
      typeof v.tokenHash === 'string' &&
      verifyApiTokenHash(token, v.tokenHash)
    );
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const token = req.headers.get('x-api-token')?.trim();

  if (!token) {
    return jsonWithCors(req, { error: 'Token obrigatório no header x-api-token' }, { status: 401 });
  }

  const db = getDb();
  const valid = await validateToken(db, token);
  if (!valid) {
    return jsonWithCors(req, { error: 'Token inválido ou revogado' }, { status: 403 });
  }

  // Parâmetros de filtro
  const categoriaParam = searchParams.get('categoria') || 'todos';
  const categoria = (CATEGORIAS as string[]).includes(categoriaParam) ? (categoriaParam as CategoriaFiltro) : 'todos';
  const dias = parseBoundedInt(searchParams.get('dias'), 30, 1, 365);
  // atributos: lista separada por vírgula, ou "todos"
  const atributosParam = searchParams.get('atributos') || 'todos';
  const atributosFiltro = atributosParam === 'todos' ? null : atributosParam.split(',').map(s => s.trim()).filter(Boolean);
  const limite = parseBoundedInt(searchParams.get('limite'), 20, 1, 100);

  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  // Filtro de atributos por nome
  let atributoIds: string[] | null = null;
  if (atributosFiltro) {
    atributoIds = await idsAtributosPorNome(db, atributosFiltro);
    if (atributoIds.length === 0) {
      return jsonWithCors(req, { error: 'Nenhum atributo válido encontrado' }, { status: 400 });
    }
  }

  const d = await dadosApiPublica(db, { desde, categoria, atributoIds, limite });
  const item = (
    tipo: 'politico' | 'orgao_publico' | 'servico_publico',
    r: { id: string | null; soma: number; total: number },
    e: { nome: string; foto_url: string | null } | undefined,
    subtipo: string,
    complemento: string,
  ) => ({
    tipo,
    id: r.id!,
    nome: e?.nome ?? 'Desconhecido',
    subtipo,
    complemento,
    foto_url: getFotoUrl(e?.foto_url),
    total_avaliacoes: r.total,
    score_liquido: Math.round(((r.soma ?? 0) / r.total) * 100),
    score_bruto: r.soma ?? 0,
  });
  const ranking = [
    ...d.rankCand.map((r) => { const c = d.cands.find((x) => x.id === r.id); return item('politico', r, c, c?.cargo ?? '', c?.partido ?? ''); }),
    ...d.rankOrg.map((r) => { const o = d.orgs.find((x) => x.id === r.id); return item('orgao_publico', r, o, o?.tipo ?? '', o?.cidade ?? ''); }),
    ...d.rankSvc.map((r) => { const v = d.svcs.find((x) => x.id === r.id); return item('servico_publico', r, v, v?.tipo ?? '', v?.cidade ?? ''); }),
  ].sort((a, b) => b.score_liquido - a.score_liquido).slice(0, limite);

  const atributos = d.temas.map((t) => ({ nome: t.nome, polaridade: t.polaridade, total: t.total }));
  const totalAvaliacoes = d.totalAvaliacoes;
  const totalEntidades = d.totalParticipantes;
  const atributosDisponiveis = d.disponiveis;

  return NextResponse.json(
    {
      meta: {
        periodo_dias: dias,
        categoria,
        atributos_filtrados: atributosFiltro ?? 'todos',
        gerado_em: new Date().toISOString(),
        total_avaliacoes: totalAvaliacoes,
        total_participantes: totalEntidades,
      },
      ranking,
      atributos_mais_citados: atributos,
      atributos_disponiveis: atributosDisponiveis,
    },
    {
      headers: {
        ...getCorsHeaders(req),
        // Resposta autenticada por token: nunca em cache compartilhado.
        'Cache-Control': 'private, max-age=60',
      },
    }
  );
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(req);

  if (origin && !corsHeaders['Access-Control-Allow-Origin']) {
    return NextResponse.json(
      { error: 'Origem não autorizada' },
      { status: 403, headers: corsHeaders }
    );
  }

  return new NextResponse(null, {
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-token, Content-Type',
      'Access-Control-Max-Age': '600',
    },
  });
}
