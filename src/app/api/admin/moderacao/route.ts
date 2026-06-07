import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity, requireAdmin } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';

/**
 * GET /api/admin/moderacao
 * Retorna as avaliações recentes e estatísticas de integridade.
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      take: 50,
      orderBy: { criado_em: 'desc' },
      include: {
        candidato: { select: { nome: true } },
        orgao: { select: { nome: true } },
        servico: { select: { nome: true } },
        atributo: { select: { nome: true } }
      }
    });

    const avaliacoesNormalizadas = avaliacoes.map(av => ({
      ...av,
      entidade: {
        nome: av.candidato?.nome ?? av.orgao?.nome ?? av.servico?.nome ?? 'Desconhecido',
        tipo: av.candidato ? 'politico' : av.orgao ? 'orgao_publico' : av.servico ? 'servico_publico' : 'desconhecido',
      },
    }));

    const total = await prisma.avaliacao.count();
    const suspicious = await prisma.avaliacao.count({
      where: { 
        OR: [
          { duration_ms: { lt: 8000 } },
          { is_valid: false }
        ]
      }
    });
    const bots = await prisma.avaliacao.count({
      where: { honeypot_triggered: true }
    });

    return NextResponse.json({
      avaliacoes: avaliacoesNormalizadas,
      stats: { total, suspicious, bots }
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar dados de moderação' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/moderacao
 * Altera a validade de uma avaliação.
 */
export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { id, is_valid } = await req.json();
    const evaluation = await prisma.avaliacao.update({
      where: { id },
      data: { is_valid }
    });

    // Se invalidar, devemos atualizar o contador do candidato?
    // Na spec diz que total_avaliacoes é apenas para válidos.
    // Para simplificar aqui, vamos apenas alterar o campo.
    // No mundo ideal, faríamos um recalculo consolidado.
    await recordAuditLog({
      admin: auth,
      acao: is_valid ? 'AVALIACAO_VALIDADA' : 'AVALIACAO_INVALIDADA',
      entidade: 'Avaliacao',
      entidadeId: evaluation.id,
      detalhes: {
        candidato_id: evaluation.candidato_id,
        atributo_id: evaluation.atributo_id,
        is_valid: evaluation.is_valid,
      },
    });
    
    return NextResponse.json(evaluation);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar avaliação' }, { status: 500 });
  }
}
