import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/relatorios
 * Retorna os dados consolidados de todos os candidatos.
 */
export async function GET() {
  try {
    const candidatos = await prisma.candidato.findMany({
      include: {
        avaliacoes: {
          where: { is_valid: true },
          include: { atributo: { select: { nome: true } } }
        }
      }
    });

    const relatorio = candidatos.map(cand => {
      // Agrupar por atributo
      const statsMap: Record<string, { total: number; soma: number }> = {};
      
      cand.avaliacoes.forEach(av => {
        const nome = av.atributo.nome;
        if (!statsMap[nome]) statsMap[nome] = { total: 0, soma: 0 };
        statsMap[nome].total++;
        statsMap[nome].soma += av.valor;
      });

      const resultados = Object.entries(statsMap).map(([atributo, data]) => ({
        atributo,
        valor: data.total > 0 ? data.soma / data.total : 0,
        total: data.total
      }));

      return {
        id: cand.id,
        nome: cand.nome,
        cargo: cand.cargo,
        total_avaliacoes: cand.total_avaliacoes,
        resultados
      };
    });

    return NextResponse.json(relatorio);
  } catch {
    return NextResponse.json({ error: 'Relatório falhou' }, { status: 500 });
  }
}
