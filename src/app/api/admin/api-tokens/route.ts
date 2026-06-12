import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity, requireAdmin } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';
import { randomBytes } from 'crypto';
import { hashApiToken, maskApiToken } from '@/lib/apiTokens';

function readTokenValue(value: unknown) {
  return (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const params = await prisma.parametroPlataforma.findMany({
      where: { grupo: 'api_tokens' },
      orderBy: { updatedAt: 'desc' },
    });

    const tokens = params.map(p => {
      const v = readTokenValue(p.valor);
      const tokenPrefix = typeof v.tokenPrefix === 'string' ? v.tokenPrefix : undefined;
      const legado = typeof v.token === 'string' && typeof v.tokenHash !== 'string';

      return {
        id: p.id,
        chave: p.chave,
        descricao: p.descricao ?? '',
        token: legado ? 'Token legado em texto — revogue e gere um novo' : maskApiToken(tokenPrefix),
        ativo: v.ativo === true,
        legado,
        criado_em: (v.criado_em as string) ?? p.updatedAt,
      };
    });

    return NextResponse.json(tokens);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar tokens' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { descricao } = await req.json();
    if (!descricao?.trim()) {
      return NextResponse.json({ error: 'Descrição obrigatória' }, { status: 400 });
    }

    const token = 'pms_' + randomBytes(24).toString('hex');
    const chave = 'api_token_' + randomBytes(6).toString('hex');
    const tokenPrefix = token.slice(0, 8);

    const parametro = await prisma.parametroPlataforma.create({
      data: {
        chave,
        valor: {
          tokenHash: hashApiToken(token),
          tokenPrefix,
          ativo: true,
          criado_em: new Date().toISOString(),
        },
        grupo: 'api_tokens',
        descricao: descricao.trim(),
      },
    });

    await recordAuditLog({
      admin: auth,
      acao: 'API_TOKEN_CRIADO',
      entidade: 'ParametroPlataforma',
      entidadeId: parametro.id,
      detalhes: { descricao: parametro.descricao },
    });

    // Retorna o token completo apenas na criação
    return NextResponse.json({
      id: parametro.id,
      chave,
      descricao: parametro.descricao,
      token,
      ativo: true,
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao criar token' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { id, ativo } = await req.json();

    const existing = await prisma.parametroPlataforma.findUnique({ where: { id } });
    if (!existing || existing.grupo !== 'api_tokens') {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 404 });
    }

    const valorAtual = readTokenValue(existing.valor);
    const isLegacy = typeof valorAtual.token === 'string' && typeof valorAtual.tokenHash !== 'string';

    if (ativo === true && isLegacy) {
      return NextResponse.json(
        { error: 'Token legado não pode ser reativado. Gere um novo token.' },
        { status: 409 }
      );
    }

    const parametro = await prisma.parametroPlataforma.update({
      where: { id },
      data: { valor: { ...valorAtual, ativo } },
    });

    await recordAuditLog({
      admin: auth,
      acao: ativo ? 'API_TOKEN_ATIVADO' : 'API_TOKEN_REVOGADO',
      entidade: 'ParametroPlataforma',
      entidadeId: parametro.id,
      detalhes: { descricao: parametro.descricao },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar token' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const existing = await prisma.parametroPlataforma.findUnique({ where: { id } });
    if (!existing || existing.grupo !== 'api_tokens') {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 404 });
    }

    await prisma.parametroPlataforma.delete({ where: { id } });

    await recordAuditLog({
      admin: auth,
      acao: 'API_TOKEN_EXCLUIDO',
      entidade: 'ParametroPlataforma',
      entidadeId: id,
      detalhes: { descricao: existing.descricao },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir token' }, { status: 500 });
  }
}
