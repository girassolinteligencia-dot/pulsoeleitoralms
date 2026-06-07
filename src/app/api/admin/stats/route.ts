import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const agora = new Date();
    const inicio24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    const inicio7d = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalEvaluations,
      totalCandidatos,
      totalCampanhas,
      totalAtributos,
      totalOrgaos,
      totalServicos,
      avaliacoes24h,
      bloqueiosAtivos,
      topCandidatosRaw,
      topOrgaosRaw,
      topServicosRaw,
      topAtributosRaw,
      atividadeSemanalRaw,
    ] = await Promise.all([
      prisma.manifestacao.count(),
      prisma.candidato.count({ where: { status: 'Ativo' } }),
      prisma.campanha.count(),
      prisma.atributo.count({ where: { visivel: true } }),
      prisma.orgaoPublico.count({ where: { status: 'Ativo' } }),
      prisma.servicoPublico.count({ where: { status: 'Ativo' } }),
      prisma.manifestacao.count({ where: { criado_em: { gte: inicio24h } } }),
      prisma.bloqueio.count({
        where: { OR: [{ expira_em: null }, { expira_em: { gt: agora } }] },
      }),
      prisma.avaliacao.groupBy({
        by: ['candidato_id'],
        where: { candidato_id: { not: null } },
        _count: { _all: true },
        _sum: { valor: true },
        orderBy: { _count: { candidato_id: 'desc' } },
        take: 5,
      }),
      prisma.avaliacao.groupBy({
        by: ['orgao_id'],
        where: { orgao_id: { not: null } },
        _count: { _all: true },
        _sum: { valor: true },
        orderBy: { _count: { orgao_id: 'desc' } },
        take: 5,
      }),
      prisma.avaliacao.groupBy({
        by: ['servico_id'],
        where: { servico_id: { not: null } },
        _count: { _all: true },
        _sum: { valor: true },
        orderBy: { _count: { servico_id: 'desc' } },
        take: 5,
      }),
      prisma.avaliacao.groupBy({
        by: ['atributo_id'],
        _count: { _all: true },
        orderBy: { _count: { atributo_id: 'desc' } },
        take: 5,
      }),
      prisma.$queryRaw<{ dia: string; total: number }[]>`
        SELECT DATE(criado_em AT TIME ZONE 'America/Campo_Grande') AS dia,
               COUNT(*)::int AS total
        FROM manifestacoes
        WHERE criado_em >= ${inicio7d}
        GROUP BY dia
        ORDER BY dia ASC
      `,
    ]);

    const candidatoIds = topCandidatosRaw.map(r => r.candidato_id).filter(Boolean) as string[];
    const candidatos = await prisma.candidato.findMany({
      where: { id: { in: candidatoIds } },
      select: { id: true, nome: true, cargo: true, cidade: true },
    });
    const candidatoMap = Object.fromEntries(candidatos.map(c => [c.id, c]));
    const topCandidatos = topCandidatosRaw.map(r => ({
      id: r.candidato_id,
      nome: candidatoMap[r.candidato_id!]?.nome ?? '—',
      cargo: candidatoMap[r.candidato_id!]?.cargo ?? '—',
      cidade: candidatoMap[r.candidato_id!]?.cidade ?? '—',
      total: r._count._all,
      liquidScore: r._sum.valor ?? 0,
    }));

    const orgaoIds = topOrgaosRaw.map(r => r.orgao_id).filter(Boolean) as string[];
    const orgaosTop = await prisma.orgaoPublico.findMany({
      where: { id: { in: orgaoIds } },
      select: { id: true, nome: true, tipo: true, cidade: true },
    });
    const orgaoMap = Object.fromEntries(orgaosTop.map(o => [o.id, o]));
    const topOrgaos = topOrgaosRaw.map(r => ({
      id: r.orgao_id,
      nome: orgaoMap[r.orgao_id!]?.nome ?? '—',
      tipo: orgaoMap[r.orgao_id!]?.tipo ?? '—',
      cidade: orgaoMap[r.orgao_id!]?.cidade ?? '—',
      total: r._count._all,
      liquidScore: r._sum.valor ?? 0,
    }));

    const servicoIds = topServicosRaw.map(r => r.servico_id).filter(Boolean) as string[];
    const servicosTop = await prisma.servicoPublico.findMany({
      where: { id: { in: servicoIds } },
      select: { id: true, nome: true, tipo: true, cidade: true },
    });
    const servicoMap = Object.fromEntries(servicosTop.map(s => [s.id, s]));
    const topServicos = topServicosRaw.map(r => ({
      id: r.servico_id,
      nome: servicoMap[r.servico_id!]?.nome ?? '—',
      tipo: servicoMap[r.servico_id!]?.tipo ?? '—',
      cidade: servicoMap[r.servico_id!]?.cidade ?? '—',
      total: r._count._all,
      liquidScore: r._sum.valor ?? 0,
    }));

    const atributoIds = topAtributosRaw.map(r => r.atributo_id);
    const atributos = await prisma.atributo.findMany({
      where: { id: { in: atributoIds } },
      select: { id: true, nome: true, polaridade: true },
    });
    const atributoMap = Object.fromEntries(atributos.map(a => [a.id, a]));
    const topAtributos = topAtributosRaw.map(r => ({
      id: r.atributo_id,
      nome: atributoMap[r.atributo_id]?.nome ?? '—',
      polaridade: atributoMap[r.atributo_id]?.polaridade ?? 1,
      total: r._count._all,
    }));

    const atividadeSemanal: { dia: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(agora);
      d.setDate(d.getDate() - i);
      const diaStr = d.toISOString().slice(0, 10);
      const encontrado = atividadeSemanalRaw.find(r => r.dia === diaStr);
      atividadeSemanal.push({ dia: diaStr, total: encontrado ? Number(encontrado.total) : 0 });
    }

    return NextResponse.json({
      totalEvaluations,
      totalCandidatos,
      totalCampanhas,
      totalAtributos,
      totalOrgaos,
      totalServicos,
      avaliacoes24h,
      bloqueiosAtivos,
      topCandidatos,
      topOrgaos,
      topServicos,
      topAtributos,
      atividadeSemanal,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
