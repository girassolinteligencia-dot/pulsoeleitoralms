import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/server/db/client';
import { entidadeInfo, somaPorAtributo } from '@/server/repos/resultados';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orgaoId: string }> }) {
  const { orgaoId } = await params;
  try {
    const db = getDb();
    if (!(await entidadeInfo(db, 'orgao', orgaoId))) {
      return NextResponse.json({ error: 'Órgão não encontrado' }, { status: 404 });
    }
    const resultados = await somaPorAtributo(db, { tipo: 'orgao', id: orgaoId });
    const data = resultados
      .map((r) => ({ atributo: r.nome, valor: Math.abs(r.soma || 0), total: r.total || 0 }))
      .sort((a, b) => b.total - a.total);
    return NextResponse.json(data.slice(0, 8));
  } catch (error) {
    console.error('Erro ao buscar resultados do órgão:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
