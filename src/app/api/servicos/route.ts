import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').trim();

  try {
    const servicos = await prisma.servicoPublico.findMany({
      where: {
        status: 'Ativo',
        ...(search && {
          OR: [
            { nome: { contains: search, mode: 'insensitive' } },
            { tipo: { contains: search, mode: 'insensitive' } },
            { cidade: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        campanha: {
          select: {
            atributos: {
              select: {
                atributo: {
                  select: { id: true, nome: true, polaridade: true },
                },
              },
              where: { atributo: { visivel: true } },
            },
          },
        },
      },
      orderBy: [{ cidade: 'asc' }, { nome: 'asc' }],
      take: 50,
    });

    return NextResponse.json(servicos);
  } catch (error) {
    console.error('Erro ao buscar serviços públicos:', error);
    return NextResponse.json([], { status: 200 });
  }
}
