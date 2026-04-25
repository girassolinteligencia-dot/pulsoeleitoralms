import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureHash, isSuspiciousTiming } from '@/lib/hash';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      candidatoId, 
      avaliacoes, 
      fingerprint,
      startTime,
      endTime,
      honeypot 
    } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ipHash = generateSecureHash(ip);
    const fingerprintHash = generateSecureHash(fingerprint);
    const duration = endTime - startTime;

    // Detecção de anomalias
    const isBot = !!honeypot;
    const isSuspicious = isSuspiciousTiming(startTime, endTime);
    const isValid = !isBot && !isSuspicious;

    // 1. Verificação de Bloqueios
    const activeBlock = await prisma.bloqueio.findFirst({
      where: {
        hash: { in: [ipHash, fingerprintHash] },
        OR: [
          { expira_em: null },
          { expira_em: { gt: new Date() } }
        ]
      }
    });

    if (activeBlock) {
      return NextResponse.json({ error: 'Acesso bloqueado por segurança.' }, { status: 429 });
    }

    // 2. Processamento da Avaliação
    await prisma.$transaction(async (tx) => {
      // Criar as avaliações
      const created = await Promise.all(
        avaliacoes.map((av: { atributoId: string, valor: number }) => 
          tx.avaliacao.create({
            data: {
              candidato_id: candidatoId,
              atributo_id: av.atributoId,
              valor: av.valor,
              is_valid: isValid,
              fingerprint_hash: fingerprintHash,
              ip_hash: ipHash,
              user_agent: userAgent,
              duration_ms: duration,
              honeypot_triggered: isBot,
              device_info: { 
                ua: userAgent,
                platform: req.headers.get('sec-ch-ua-platform') || 'unknown'
              }
            }
          })
        )
      );

      // Se for válido, atualizar estatísticas
      if (isValid) {
        await tx.candidato.update({
          where: { id: candidatoId },
          data: { total_avaliacoes: { increment: avaliacoes.length } }
        });

        const cand = await tx.candidato.findUnique({
          where: { id: candidatoId },
          select: { campanha_id: true }
        });

        if (cand) {
          await tx.campanha.update({
            where: { id: cand.campanha_id },
            data: { total_votos: { increment: 1 } }
          });
        }
      } else {
        // Log de Auditoria para atividade suspeita
        await tx.auditLog.create({
          data: {
            acao: isBot ? 'BOT_DETECTED' : 'SUSPICIOUS_TIMING',
            entidade: 'Avaliacao',
            entidade_id: candidatoId,
            detalhes: {
              ip_hash: ipHash,
              duration_ms: duration,
              fingerprint: fingerprintHash
            }
          }
        });
      }

      return created;
    });

    return NextResponse.json({ 
      success: true, 
      status: isValid ? 'confirmed' : 'flagged' 
    });

  } catch (error) {
    console.error('Erro ao processar pulso:', error);
    return NextResponse.json({ error: 'Erro interno no processamento do pulso.' }, { status: 500 });
  }
}
