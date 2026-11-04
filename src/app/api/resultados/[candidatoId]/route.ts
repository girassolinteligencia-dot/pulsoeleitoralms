import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/server/db/client';
import { atributosDaCampanhaDoCandidato, somaPorAtributo } from '@/server/repos/resultados';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ candidatoId: string }> }) {
  const { candidatoId } = await params;
  try {
    const db = getDb();
    const campanha = await atributosDaCampanhaDoCandidato(db, candidatoId);
    if (!campanha) return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 });

    const resultados = await somaPorAtributo(db, { tipo: 'candidato', id: candidatoId });
    const data = campanha.atributos
      .map((ca) => {
        const res = resultados.find((r) => r.atributo_id === ca.atributo_id);
        return { atributo: ca.nome, valor: Math.abs(res?.soma || 0), total: res?.total || 0 };
      })
      .sort((a, b) => b.total - a.total);

    const activeData = data.filter((item) => item.total > 0).slice(0, 8);
    return NextResponse.json(activeData.length > 0 ? activeData : data.slice(0, 8));
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
