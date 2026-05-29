import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const [totalEvaluations, totalCandidatos, totalCampanhas] = await Promise.all([
      prisma.avaliacao.count(),
      prisma.candidato.count(),
      prisma.campanha.count()
    ]);

    return NextResponse.json({
      totalEvaluations,
      totalCandidatos,
      totalCampanhas
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
