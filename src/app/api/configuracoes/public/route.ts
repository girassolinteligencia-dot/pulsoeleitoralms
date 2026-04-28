import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const parametros = await prisma.parametroPlataforma.findMany();
    
    // Transformar array em objeto chave-valor para facilitar o uso no frontend
    const config = parametros.reduce((acc, curr) => {
      acc[curr.chave] = curr.valor;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}
