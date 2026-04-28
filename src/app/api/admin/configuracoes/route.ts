import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const parametros = await prisma.parametroPlataforma.findMany({
      orderBy: { grupo: 'asc' }
    });
    return NextResponse.json(parametros);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar parâmetros' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { chave, valor, grupo, descricao } = await req.json();

    const parametro = await prisma.parametroPlataforma.upsert({
      where: { chave },
      update: { valor, grupo, descricao },
      create: { chave, valor, grupo, descricao }
    });

    return NextResponse.json(parametro);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar parâmetro' }, { status: 500 });
  }
}
