import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const evaluations = await prisma.avaliacao.findMany({
      take: 10,
      orderBy: { criado_em: 'desc' },
      include: {
        candidato: { select: { nome: true } },
        orgao: { select: { nome: true } },
        servico: { select: { nome: true } },
        atributo: { select: { nome: true } }
      }
    });

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
