import { NextResponse } from 'next/server';
import { count, eq } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { manifestacoes } from '@/server/db/schema';
import { getParametrosPorPrefixo } from '@/server/repos/parametros';

const PREFIXOS_PUBLICOS = [
  'geral_', 'onboarding_', 'public_', 'landing_', 'fluxo_', 'etapafinal_', 'resultado_', 'sugestao_',
];

export async function GET() {
  try {
    const db = getDb();
    const [parametros, [total]] = await Promise.all([
      getParametrosPorPrefixo(db, PREFIXOS_PUBLICOS),
      db.select({ n: count() }).from(manifestacoes).where(eq(manifestacoes.is_valid, true)),
    ]);
    return NextResponse.json(
      { ...Object.fromEntries(parametros), _total_pulsos: total?.n ?? 0 },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
    );
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}
