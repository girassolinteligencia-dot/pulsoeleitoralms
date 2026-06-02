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
      avaliacoes24h,
      bloqueiosAtivos,
      topCandidatosRaw,
      topAtributosRaw,
      atividadeSemanalRaw,
    ] = await Promise.all([
      prisma.manifestacao.count(),
      prisma.candidato.count({ where: { status: 'Ativo' } }),
      prisma.campanha.count(),
      prisma.atributo.count({ where: { visivel: true } }),
      prisma.manifestacao.count({ where: { criado_em: { gte: inicio24h } } }),
      prisma.bloqueio.count({
        where: { OR: [{ expira_em: null }, { expira_em: { gt: agora } }] },
      }),
      // top 5 candidatos por volume de avaliações
      prisma.avaliacao.groupBy({
        by: ['candidato_id'],
        _count: { _all: true },
        _sum: { valor: true },
        orderBy: { _count: { candidato_id: 'desc' } },
        take: 5,
      }),
      // top 5 atributos por volume
      prisma.avaliacao.groupBy({
        by: ['atributo_id'],
        _count: { _all: true },
        orderBy: { _count: { atributo_id: 'desc' } },
        take: 5,
      }),
      // atividade diária últimos 7 dias via raw query
      prisma.$queryRaw<{ dia: string; total: number }[]>`
        SELECT DATE(criado_em AT TIME ZONE 'America/Campo_Grande') AS dia,
               COUNT(*)::int AS total
        FROM manifestacoes
        WHERE criado_em >= ${inicio7d}
        GROUP BY dia
        ORDER BY dia ASC
      `,
    ]);

    // enriquece top candidatos com nome/cargo
    const candidatoIds = topCandidatosRaw.map(r => r.candidato_id);
    const candidatos = await prisma.candidato.findMany({
      where: { id: { in: candidatoIds } },
      select: { id: true, nome: true, cargo: true, cidade: true },
    });
    const candidatoMap = Object.fromEntries(candidatos.map(c => [c.id, c]));

    const topCandidatos = topCandidatosRaw.map(r => ({
      id: r.candidato_id,
      nome: candidatoMap[r.candidato_id]?.nome ?? '—',
      cargo: candidatoMap[r.candidato_id]?.cargo ?? '—',
      cidade: candidatoMap[r.candidato_id]?.cidade ?? '—',
      total: r._count._all,
      liquidScore: r._sum.valor ?? 0,
    }));

    // enriquece top atributos com nome/polaridade
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

    // normaliza atividade semanal (garante 7 dias mesmo sem dados)
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
      avaliacoes24h,
      bloqueiosAtivos,
      topCandidatos,
      topAtributos,
      atividadeSemanal,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
