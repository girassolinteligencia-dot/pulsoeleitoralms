import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureHash } from '@/lib/hash';
import { createEvaluationSession } from '@/lib/evaluationSession';
import { buildPublicCandidateWhere, getPublicScopeConfig } from '@/lib/publicScope';
import { checkRateLimit } from '@/lib/rateLimit';

const SESSION_RATE_LIMIT = 20;
const SESSION_RATE_WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidatoId, orgaoId, servicoId, fingerprint } = body;

    if (typeof fingerprint !== 'string' || fingerprint.length < 8 || fingerprint.length > 512) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const fingerprintHash = generateSecureHash(fingerprint);
    const ipLimit = checkRateLimit(`avaliar:session:ip:${generateSecureHash(ip)}`, SESSION_RATE_LIMIT, SESSION_RATE_WINDOW_MS);
    const fingerprintLimit = checkRateLimit(`avaliar:session:fp:${fingerprintHash}`, SESSION_RATE_LIMIT, SESSION_RATE_WINDOW_MS);

    if (!ipLimit.allowed || !fingerprintLimit.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas em curto período.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(ipLimit.retryAfter, fingerprintLimit.retryAfter, 1)),
          },
        }
      );
    }

    let entityId: string;

    if (typeof orgaoId === 'string') {
      const orgao = await prisma.orgaoPublico.findFirst({
        where: { id: orgaoId, status: 'Ativo' },
        select: { id: true },
      });
      if (!orgao) {
        return NextResponse.json({ error: 'Órgão indisponível.' }, { status: 404 });
      }
      entityId = orgaoId;
    } else if (typeof servicoId === 'string') {
      const svc = await prisma.servicoPublico.findFirst({
        where: { id: servicoId, status: 'Ativo' },
        select: { id: true },
      });
      if (!svc) {
        return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 404 });
      }
      entityId = servicoId;
    } else if (typeof candidatoId === 'string') {
      const scopeConfig = await getPublicScopeConfig();
      const candidato = await prisma.candidato.findFirst({
        where: buildPublicCandidateWhere(scopeConfig, { id: candidatoId }),
        select: { id: true },
      });
      if (!candidato) {
        return NextResponse.json({ error: 'Candidato indisponível.' }, { status: 404 });
      }
      entityId = candidatoId;
    } else {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const session = createEvaluationSession(entityId, fingerprintHash);

    return NextResponse.json(session);
  } catch (error) {
    console.error('Erro ao criar sessão de avaliação:', error);
    return NextResponse.json({ error: 'Erro interno ao iniciar avaliação.' }, { status: 500 });
  }
}
