import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      include: {
        candidato: true,
        atributo: true
      },
      orderBy: { criado_em: 'desc' }
    });

    // Generate CSV
    const headers = ['ID', 'Candidato', 'Atributo', 'Valor', 'IP_Hash', 'Fingerprint_Hash', 'Data'];
    const rows = avaliacoes.map(a => [
      a.id,
      a.candidato.nome,
      a.atributo.nome,
      a.valor,
      a.ip_hash,
      a.fingerprint_hash,
      a.criado_em.toISOString()
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=avaliacoes_voz_publica.csv'
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
