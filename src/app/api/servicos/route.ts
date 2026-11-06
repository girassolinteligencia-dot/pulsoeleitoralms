import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/server/db/client';
import { listarEntidadesPublicas } from '@/server/repos/catalogo';

export async function GET(req: NextRequest) {
  const search = (req.nextUrl.searchParams.get('search') || '').trim().slice(0, 100);
  try {
    return NextResponse.json(await listarEntidadesPublicas(getDb(), 'servico', search));
  } catch (error) {
    console.error('Erro ao buscar serviços públicos:', error);
    return NextResponse.json([], { status: 200 });
  }
}
