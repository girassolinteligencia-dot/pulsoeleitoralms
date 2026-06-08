import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const parametros = await prisma.parametroPlataforma.findMany({
      where: {
        OR: [
          { chave: { startsWith: 'geral_' } },
          { chave: { startsWith: 'onboarding_' } },
          { chave: { startsWith: 'public_' } },
          { chave: { startsWith: 'landing_' } },
          { chave: { startsWith: 'fluxo_' } },
          { chave: { startsWith: 'etapafinal_' } },
          { chave: { startsWith: 'resultado_' } },
          { chave: { startsWith: 'sugestao_' } },
        ],
      },
    });
    
    // Transformar array em objeto chave-valor para facilitar o uso no frontend
    const config = parametros.reduce((acc, curr) => {
      acc[curr.chave] = curr.valor;
      return acc;
    }, {} as Record<string, unknown>);

    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}
