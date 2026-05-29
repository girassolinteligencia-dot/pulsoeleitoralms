import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ candidatoId: string }> }
) {
  const { candidatoId } = await params;

  try {
    // 1. Fetch candidate and their campaign attributes
    const candidato = await prisma.candidato.findUnique({
      where: { id: candidatoId },
      include: {
        campanha: {
          include: {
            atributos: {
              include: {
                atributo: true
              }
            }
          }
        }
      }
    });

    if (!candidato) {
      return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 });
    }

    // 2. Fetch evaluation counts per attribute
    const resultados = await prisma.avaliacao.groupBy({
      by: ['atributo_id'],
      where: { 
        candidato_id: candidatoId,
        is_valid: true 
      },
      _sum: { valor: true },
      _count: { _all: true }
    });

    // 3. Map campaign attributes to results, keeping the visual readable.
    const data = candidato.campanha.atributos.map(ca => {
      const res = resultados.find(r => r.atributo_id === ca.atributo_id);
      return {
        atributo: ca.atributo.nome,
        valor: Math.abs(res?._sum.valor || 0),
        total: res?._count._all || 0
      };
    }).sort((a, b) => b.total - a.total);

    const activeData = data.filter((item) => item.total > 0).slice(0, 8);
    return NextResponse.json(activeData.length > 0 ? activeData : data.slice(0, 8));
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

