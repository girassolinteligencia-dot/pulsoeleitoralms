import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureHash, isSuspiciousTiming } from '@/lib/hash';
import { verifyEvaluationSession } from '@/lib/evaluationSession';
import { buildPublicCandidateWhere, getPublicScopeConfig } from '@/lib/publicScope';

interface AvaliacaoInput {
  atributoId: string;
  valor: number;
}

function isValidAvaliacaoInput(value: unknown): value is AvaliacaoInput {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.atributoId === 'string' &&
    (item.valor === 1 || item.valor === -1)
  );
}

const PERFIL_STRING_FIELDS = [
  'ideologia',
  'sexo',
  'cor',
  'escolaridade',
  'estadoCivil',
  'faixaSalarial',
  'religiao',
  'ocupacao',
  'filhos',
  'orientacaoSexual',
  'deficiencia',
  'tempoResidencia',
  'cidade',
  'bairro',
  'uf',
  'localidadeOrigem',
] as const;

const TITLE_CASE_LOWER_WORDS = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

function normalizeTerritoryName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map((part, index) => {
      if (index > 0 && TITLE_CASE_LOWER_WORDS.has(part)) return part;
      return part.charAt(0).toLocaleUpperCase('pt-BR') + part.slice(1);
    })
    .join(' ')
    .slice(0, 120);
}

function sanitizePerfil(value: unknown) {
  const sanitized: Record<string, string | number | null> = {};
  if (!value || typeof value !== 'object') return sanitized;

  const record = value as Record<string, unknown>;
  for (const field of PERFIL_STRING_FIELDS) {
    const fieldValue = record[field];
    if (typeof fieldValue === 'string') {
      if (field === 'cidade' || field === 'bairro') {
        sanitized[field] = normalizeTerritoryName(fieldValue);
      } else if (field === 'uf') {
        sanitized[field] = fieldValue.trim().toLocaleUpperCase('pt-BR').slice(0, 2);
      } else {
        sanitized[field] = fieldValue.trim().slice(0, 120);
      }
    }
  }

  const bairroConfianca = record.bairroConfianca;
  if (typeof bairroConfianca === 'number' && Number.isFinite(bairroConfianca)) {
    sanitized.bairroConfianca = Math.max(0, Math.min(1, bairroConfianca));
  }

  return sanitized;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      candidatoId, 
      avaliacoes, 
      fingerprint,
      sessionToken,
      honeypot,
      perfil,
      aprovacao,
      expectativaVitoria
    } = body;

    if (
      typeof candidatoId !== 'string' ||
      typeof fingerprint !== 'string' ||
      typeof sessionToken !== 'string' ||
      !Array.isArray(avaliacoes) ||
      avaliacoes.length === 0 ||
      !avaliacoes.every(isValidAvaliacaoInput)
    ) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const uniqueAtributos = new Set(avaliacoes.map((av: AvaliacaoInput) => av.atributoId));
    if (uniqueAtributos.size !== avaliacoes.length) {
      return NextResponse.json({ error: 'Atributos duplicados não são permitidos.' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ipHash = generateSecureHash(ip);
    const fingerprintHash = generateSecureHash(fingerprint);
    const evaluationSession = verifyEvaluationSession(sessionToken);

    if (
      !evaluationSession ||
      evaluationSession.candidatoId !== candidatoId ||
      evaluationSession.fingerprintHash !== fingerprintHash
    ) {
      return NextResponse.json({ error: 'Sessão de avaliação inválida ou expirada.' }, { status: 400 });
    }

    const endTime = Date.now();
    const duration = endTime - evaluationSession.startedAt;

    const scopeConfig = await getPublicScopeConfig();
    const candidato = await prisma.candidato.findFirst({
      where: buildPublicCandidateWhere(scopeConfig, { id: candidatoId }),
      include: {
        campanha: {
          include: {
            atributos: {
              where: {
                atributo: {
                  visivel: true,
                },
              },
              select: {
                atributo_id: true,
              },
            },
          },
        },
      },
    });

    if (!candidato) {
      return NextResponse.json({ error: 'Candidato indisponível para avaliação.' }, { status: 404 });
    }

    const atributosPermitidos = new Set(candidato.campanha.atributos.map((item) => item.atributo_id));
    const hasInvalidAtributo = avaliacoes.some((av: AvaliacaoInput) => !atributosPermitidos.has(av.atributoId));
    if (hasInvalidAtributo) {
      return NextResponse.json({ error: 'Atributo inválido para a campanha selecionada.' }, { status: 400 });
    }

    // Detecção de anomalias
    const isBot = !!honeypot;
    const isSuspicious = isSuspiciousTiming(evaluationSession.startedAt, endTime);
    const isValid = !isBot && !isSuspicious;
    const sanitizedPerfil = sanitizePerfil(perfil);

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

    const recentWindow = new Date(Date.now() - 60 * 1000);
    const recentManifestacoes = await prisma.manifestacao.count({
      where: {
        criado_em: { gte: recentWindow },
        OR: [
          { ip_hash: ipHash },
          { fingerprint_hash: fingerprintHash },
        ],
      },
    });

    if (recentManifestacoes >= 10) {
      return NextResponse.json({ error: 'Muitas manifestações em curto período.' }, { status: 429 });
    }

    // 2. Processamento da Avaliação
    await prisma.$transaction(async (tx) => {
      // Criar a Manifestação (Sessão de Voto)
      const manifestacao = await tx.manifestacao.create({
        data: {
          candidato_id: candidatoId,
          aprovacao,
          expectativa_vitoria: expectativaVitoria,
          perfil: sanitizedPerfil,
          fingerprint_hash: fingerprintHash,
          ip_hash: ipHash,
          user_agent: userAgent,
          duration_ms: duration,
          is_valid: isValid,
          honeypot_triggered: isBot
        }
      });

      // Criar as avaliações linkadas
      const created = await Promise.all(
        avaliacoes.map((av: AvaliacaoInput) => 
          tx.avaliacao.create({
            data: {
              manifestacao_id: manifestacao.id,
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
          data: { total_avaliacoes: { increment: 1 } } // Incrementamos sessões, não atributos individualmente
        });

        await tx.campanha.update({
          where: { id: candidato.campanha_id },
          data: { total_votos: { increment: 1 } }
        });
      } else {
        // Log de Auditoria para atividade suspeita
        await tx.auditLog.create({
          data: {
            acao: isBot ? 'BOT_DETECTED' : 'SUSPICIOUS_TIMING',
            entidade: 'Manifestacao',
            entidade_id: manifestacao.id,
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
    console.error('Erro ao processar voz:', error);
    return NextResponse.json({ error: 'Erro interno no processamento da manifestação.' }, { status: 500 });
  }
}
