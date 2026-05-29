import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureHash } from '@/lib/hash';
import { createEvaluationSession } from '@/lib/evaluationSession';
import { buildPublicCandidateWhere, getPublicScopeConfig } from '@/lib/publicScope';

export async function POST(req: NextRequest) {
  try {
    const { candidatoId, fingerprint } = await req.json();

    if (typeof candidatoId !== 'string' || typeof fingerprint !== 'string') {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const scopeConfig = await getPublicScopeConfig();
    const candidato = await prisma.candidato.findFirst({
      where: buildPublicCandidateWhere(scopeConfig, { id: candidatoId }),
      select: {
        id: true,
      },
    });

    if (!candidato) {
      return NextResponse.json({ error: 'Candidato indisponível.' }, { status: 404 });
    }

    const session = createEvaluationSession(candidatoId, generateSecureHash(fingerprint));

    return NextResponse.json(session);
  } catch (error) {
    console.error('Erro ao criar sessão de avaliação:', error);
    return NextResponse.json({ error: 'Erro interno ao iniciar avaliação.' }, { status: 500 });
  }
}
