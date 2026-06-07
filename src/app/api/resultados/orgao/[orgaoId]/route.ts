import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgaoId: string }> }
) {
  const { orgaoId } = await params;

  try {
    const orgao = await prisma.orgaoPublico.findUnique({
      where: { id: orgaoId },
      include: {
        campanha: {
          include: {
            atributos: { include: { atributo: true } },
          },
        },
      },
    });

    if (!orgao || !orgao.campanha) {
      return NextResponse.json({ error: 'Órgão não encontrado' }, { status: 404 });
    }

    const resultados = await prisma.avaliacao.groupBy({
      by: ['atributo_id'],
      where: { orgao_id: orgaoId, is_valid: true },
      _sum: { valor: true },
      _count: { _all: true },
    });

    const data = orgao.campanha.atributos
      .map((ca) => {
        const res = resultados.find((r) => r.atributo_id === ca.atributo_id);
        return {
          atributo: ca.atributo.nome,
          valor: Math.abs(res?._sum.valor || 0),
          total: res?._count._all || 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    const activeData = data.filter((item) => item.total > 0).slice(0, 8);
    return NextResponse.json(activeData.length > 0 ? activeData : data.slice(0, 8));
  } catch (error) {
    console.error('Erro ao buscar resultados do órgão:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
