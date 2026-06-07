import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type CategoriaFiltro = 'todos' | 'politico' | 'orgao_publico' | 'servico_publico';

function buildCategoriaWhere(categoria: CategoriaFiltro, base: Record<string, unknown>) {
  if (categoria === 'politico') return { ...base, candidato_id: { not: null } };
  if (categoria === 'orgao_publico') return { ...base, orgao_id: { not: null } };
  if (categoria === 'servico_publico') return { ...base, servico_id: { not: null } };
  return base;
}

async function validateToken(token: string): Promise<boolean> {
  const param = await prisma.parametroPlataforma.findFirst({
    where: {
      chave: { startsWith: 'api_token_' },
      valor: { equals: { token, ativo: true } as unknown as never },
    },
  });
  // Busca manual pois o JSON exact match via Prisma não funciona em todos os providers
  if (param) return true;

  // Fallback: busca todos os tokens ativos e compara
  const allTokens = await prisma.parametroPlataforma.findMany({
    where: { chave: { startsWith: 'api_token_' }, grupo: 'api_tokens' },
  });
  return allTokens.some(p => {
    const v = p.valor as Record<string, unknown>;
    return v?.token === token && v?.ativo === true;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Autenticação por token
  const token =
    req.headers.get('x-api-token') ??
    searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token obrigatório' }, { status: 401 });
  }

  const valid = await validateToken(token);
  if (!valid) {
    return NextResponse.json({ error: 'Token inválido ou revogado' }, { status: 403 });
  }

  // Parâmetros de filtro
  const categoria = (searchParams.get('categoria') || 'todos') as CategoriaFiltro;
  const diasParam = searchParams.get('dias');
  const dias = diasParam ? parseInt(diasParam) : 30;
  // atributos: lista separada por vírgula, ou "todos"
  const atributosParam = searchParams.get('atributos') || 'todos';
  const atributosFiltro = atributosParam === 'todos' ? null : atributosParam.split(',').map(s => s.trim()).filter(Boolean);
  const limite = Math.min(parseInt(searchParams.get('limite') || '20'), 100);

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
      return NextResponse.json({ error: 'Nenhum atributo válido encontrado' }, { status: 400 });
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
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-token, Content-Type',
    },
  });
}
