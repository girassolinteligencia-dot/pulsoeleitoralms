import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity, requireAdmin } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const manifestacoes = await prisma.manifestacao.findMany({
      take: 50,
      orderBy: { criado_em: 'desc' },
      include: {
        candidato: { select: { nome: true } },
        orgao:     { select: { nome: true } },
        servico:   { select: { nome: true } },
        avaliacoes: {
          include: { atributo: { select: { nome: true } } },
          orderBy: { criado_em: 'asc' },
        },
      },
    });

    const manifestacoesNormalizadas = manifestacoes.map(m => ({
      ...m,
      entidade: {
        nome: m.candidato?.nome ?? m.orgao?.nome ?? m.servico?.nome ?? 'Desconhecido',
        tipo: m.candidato ? 'politico' : m.orgao ? 'orgao_publico' : m.servico ? 'servico_publico' : 'desconhecido',
      },
    }));

    const total      = await prisma.manifestacao.count();
    const suspicious = await prisma.manifestacao.count({
      where: {
        OR: [
          { duration_ms: { lt: 8000, not: null } },
          { is_valid: false },
        ],
      },
    });
    const bots = await prisma.manifestacao.count({
      where: { honeypot_triggered: true },
    });

    return NextResponse.json({
      manifestacoes: manifestacoesNormalizadas,
      stats: { total, suspicious, bots },
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar dados de moderação' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { id, is_valid } = await req.json();
    const manifestacao = await prisma.manifestacao.update({
      where: { id },
      data: { is_valid },
    });

    await recordAuditLog({
      admin: auth,
      acao: is_valid ? 'MANIFESTACAO_VALIDADA' : 'MANIFESTACAO_INVALIDADA',
      entidade: 'Manifestacao',
      entidadeId: manifestacao.id,
      detalhes: {
        candidato_id: manifestacao.candidato_id,
        is_valid: manifestacao.is_valid,
      },
    });

    return NextResponse.json(manifestacao);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar manifestação' }, { status: 500 });
  }
}
