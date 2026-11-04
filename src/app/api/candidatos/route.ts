import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/server/db/client';
import { listarCandidatosPublicos } from '@/server/repos/catalogo';

export async function GET(req: NextRequest) {
  const search = (req.nextUrl.searchParams.get('search') || '').trim().slice(0, 100);
  try {
    // Cidade/bairro informados pelo usuário são variáveis do respondente:
    // a busca pública mantém todos os candidatos ativos disponíveis.
    return NextResponse.json(await listarCandidatosPublicos(getDb(), search));
  } catch (error) {
    console.error('Erro ao buscar candidatos:', error);
    return NextResponse.json([], { status: 200 });
  }
}
