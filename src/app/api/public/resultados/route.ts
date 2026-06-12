import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiTokenHash } from '@/lib/apiTokens';

type CategoriaFiltro = 'todos' | 'politico' | 'orgao_publico' | 'servico_publico';

function buildCategoriaWhere(categoria: CategoriaFiltro, base: Record<string, unknown>) {
  if (categoria === 'politico') return { ...base, candidato_id: { not: null } };
  if (categoria === 'orgao_publico') return { ...base, orgao_id: { not: null } };
  if (categoria === 'servico_publico') return { ...base, servico_id: { not: null } };
  return base;
}

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

async function validateToken(token: string): Promise<boolean> {
  const allTokens = await prisma.parametroPlataforma.findMany({
    where: { chave: { startsWith: 'api_token_' }, grupo: 'api_tokens' },
  });

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

  const valid = await validateToken(token);
  if (!valid) {
    return jsonWithCors(req, { error: 'Token inválido ou revogado' }, { status: 403 });
  }

  // Parâmetros de filtro
  const categoria = (searchParams.get('categoria') || 'todos') as CategoriaFiltro;
  const dias = parseBoundedInt(searchParams.get('dias'), 30, 1, 365);
  // atributos: lista separada por vírgula, ou "todos"
  const atributosParam = searchParams.get('atributos') || 'todos';
  const atributosFiltro = atributosParam === 'todos' ? null : atributosParam.split(',').map(s => s.trim()).filter(Boolean);
  const limite = parseBoundedInt(searchParams.get('limite'), 20, 1, 100);

  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  const baseWhere = { criado_em: { gte: desde }, is_valid: true };
  const avaliacaoWhere = buildCategoriaWhere(categoria, baseWhere);

  // Adiciona filtro de atributos se selecionado
  let atributoIds: string[] | null = null;
  if (atributosFiltro) {
    const atributosEncontrados = await prisma.atributo.findMany({
      where: { nome: { in: atributosFiltro }, visivel: true },
      select: { id: true, nome: true },
    });
    atributoIds = atributosEncontrados.map(a => a.id);
    if (atributoIds.length === 0) {
      return jsonWithCors(req, { error: 'Nenhum atributo válido encontrado' }, { status: 400 });
    }
  }

  const avaliacaoWhereComAtrib = atributoIds
    ? { ...avaliacaoWhere, atributo_id: { in: atributoIds } }
    : avaliacaoWhere;

  // 1. Ranking de entidades
  const [rankingCandRaw, rankingOrgRaw, rankingSvcRaw] = await Promise.all([
    categoria === 'todos' || categoria === 'politico'
      ? prisma.avaliacao.groupBy({
          by: ['candidato_id'],
          _sum: { valor: true },
          _count: { _all: true },
          where: { ...avaliacaoWhereComAtrib, candidato_id: { not: null } },
          orderBy: { _count: { candidato_id: 'desc' } },
          take: limite,
        })
      : Promise.resolve([]),
    categoria === 'todos' || categoria === 'orgao_publico'
      ? prisma.avaliacao.groupBy({
          by: ['orgao_id'],
          _sum: { valor: true },
          _count: { _all: true },
          where: { ...avaliacaoWhereComAtrib, orgao_id: { not: null } },
          orderBy: { _count: { orgao_id: 'desc' } },
          take: limite,
        })
      : Promise.resolve([]),
    categoria === 'todos' || categoria === 'servico_publico'
      ? prisma.avaliacao.groupBy({
          by: ['servico_id'],
          _sum: { valor: true },
          _count: { _all: true },
          where: { ...avaliacaoWhereComAtrib, servico_id: { not: null } },
          orderBy: { _count: { servico_id: 'desc' } },
          take: limite,
        })
      : Promise.resolve([]),
  ]);

  const [candidatos, orgaos, servicos] = await Promise.all([
    rankingCandRaw.length > 0
      ? prisma.candidato.findMany({
          where: { id: { in: rankingCandRaw.map(r => r.candidato_id!).filter(Boolean) } },
          select: { id: true, nome: true, cargo: true, partido: true, foto_url: true },
        })
      : Promise.resolve([]),
    rankingOrgRaw.length > 0
      ? prisma.orgaoPublico.findMany({
          where: { id: { in: rankingOrgRaw.map(r => r.orgao_id!).filter(Boolean) } },
          select: { id: true, nome: true, tipo: true, cidade: true, foto_url: true },
        })
      : Promise.resolve([]),
    rankingSvcRaw.length > 0
      ? prisma.servicoPublico.findMany({
          where: { id: { in: rankingSvcRaw.map(r => r.servico_id!).filter(Boolean) } },
          select: { id: true, nome: true, tipo: true, cidade: true, foto_url: true },
        })
      : Promise.resolve([]),
  ]);

  const ranking = [
    ...rankingCandRaw.map(r => {
      const c = candidatos.find(x => x.id === r.candidato_id);
      const score = r._sum.valor ?? 0;
      return {
        tipo: 'politico' as const,
        id: r.candidato_id!,
        nome: c?.nome ?? 'Desconhecido',
        subtipo: c?.cargo ?? '',
        complemento: c?.partido ?? '',
        foto_url: c?.foto_url ?? null,
        total_avaliacoes: r._count._all,
        score_liquido: Math.round((score / r._count._all) * 100),
        score_bruto: score,
      };
    }),
    ...rankingOrgRaw.map(r => {
      const o = orgaos.find(x => x.id === r.orgao_id);
      const score = r._sum.valor ?? 0;
      return {
        tipo: 'orgao_publico' as const,
        id: r.orgao_id!,
        nome: o?.nome ?? 'Desconhecido',
        subtipo: o?.tipo ?? '',
        complemento: o?.cidade ?? '',
        foto_url: o?.foto_url ?? null,
        total_avaliacoes: r._count._all,
        score_liquido: Math.round((score / r._count._all) * 100),
        score_bruto: score,
      };
    }),
    ...rankingSvcRaw.map(r => {
      const s = servicos.find(x => x.id === r.servico_id);
      const score = r._sum.valor ?? 0;
      return {
        tipo: 'servico_publico' as const,
        id: r.servico_id!,
        nome: s?.nome ?? 'Desconhecido',
        subtipo: s?.tipo ?? '',
        complemento: s?.cidade ?? '',
        foto_url: s?.foto_url ?? null,
        total_avaliacoes: r._count._all,
        score_liquido: Math.round((score / r._count._all) * 100),
        score_bruto: score,
      };
    }),
  ].sort((a, b) => b.score_liquido - a.score_liquido).slice(0, limite);

  // 2. Top atributos
  const temasRaw = await prisma.avaliacao.groupBy({
    by: ['atributo_id'],
    _count: { _all: true },
    where: avaliacaoWhereComAtrib,
    orderBy: { _count: { atributo_id: 'desc' } },
    take: 10,
  });

  const atributosInfo = await prisma.atributo.findMany({
    where: { id: { in: temasRaw.map(t => t.atributo_id) } },
    select: { id: true, nome: true, polaridade: true },
  });

  const atributos = temasRaw.map(t => {
    const info = atributosInfo.find(a => a.id === t.atributo_id);
    return {
      nome: info?.nome ?? 'N/A',
      polaridade: info?.polaridade ?? 0,
      total: t._count._all,
    };
  });

  // 3. Totais gerais
  const [totalAvaliacoes, totalEntidades] = await Promise.all([
    prisma.avaliacao.count({ where: avaliacaoWhereComAtrib }),
    prisma.manifestacao.count({ where: { criado_em: { gte: desde }, is_valid: true } }),
  ]);

  // Lista de atributos disponíveis (útil para montar filtros no site externo)
  const atributosDisponiveis = await prisma.atributo.findMany({
    where: { visivel: true },
    select: { nome: true, polaridade: true },
    orderBy: { nome: 'asc' },
  });

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
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
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
