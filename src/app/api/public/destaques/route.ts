import { NextResponse } from 'next/server';
import { getDb } from '@/server/db/client';
import { destaquesPorIds } from '@/server/repos/catalogo';
import { asStringArray, getParametros } from '@/server/repos/parametros';

export async function GET() {
  try {
    const db = getDb();
    const p = await getParametros(db, ['destaques_orgaos', 'destaques_servicos']);
    const [orgaos, servicos] = await Promise.all([
      destaquesPorIds(db, 'orgao', asStringArray(p.get('destaques_orgaos'))),
      destaquesPorIds(db, 'servico', asStringArray(p.get('destaques_servicos'))),
    ]);
    return NextResponse.json(
      { orgaos, servicos },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
    );
  } catch {
    return NextResponse.json({ orgaos: [], servicos: [] }, { status: 500 });
  }
}
