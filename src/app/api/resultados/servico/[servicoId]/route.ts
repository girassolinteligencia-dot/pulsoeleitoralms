import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ servicoId: string }> }
) {
  const { servicoId } = await params;

  try {
    const servico = await prisma.servicoPublico.findUnique({
      where: { id: servicoId },
      include: {
        campanha: { include: { atributos: { include: { atributo: true } } } },
      },
    });

    if (!servico) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    const resultados = await prisma.avaliacao.groupBy({
      by: ['atributo_id'],
      where: { servico_id: servicoId, is_valid: true },
      _sum: { valor: true },
      _count: { _all: true },
    });

    if (resultados.length === 0) {
      return NextResponse.json([]);
    }

    const atributoIds = resultados.map(r => r.atributo_id);
    const atributos = await prisma.atributo.findMany({
      where: { id: { in: atributoIds } },
      select: { id: true, nome: true },
    });
    const nomeMap = new Map(atributos.map(a => [a.id, a.nome]));

    const data = resultados
      .map((r) => ({
        atributo: nomeMap.get(r.atributo_id) ?? r.atributo_id,
        valor: Math.abs(r._sum.valor || 0),
        total: r._count._all || 0,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json(data.slice(0, 8));
  } catch (error) {
    console.error('Erro ao buscar resultados do serviço:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
