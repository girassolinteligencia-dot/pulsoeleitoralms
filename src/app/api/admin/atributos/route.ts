import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity, requireAdmin } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';

/**
 * GET /api/admin/atributos
 * Retorna todos os atributos cadastrados (incluindo os ocultos, para o admin).
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const atributos = await prisma.atributo.findMany({
      orderBy: { nome: 'asc' }
    });
    return NextResponse.json(atributos);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar atributos' }, { status: 500 });
  }
}

/**
 * POST /api/admin/atributos
 * Cria um novo atributo.
 */
export async function POST(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { nome, descricao, polaridade, icone, visivel } = await req.json();
    const atributo = await prisma.atributo.create({
      data: { 
        nome, 
        descricao, 
        polaridade, 
        icone,
        visivel: visivel !== undefined ? visivel : true
      }
    });
    await recordAuditLog({
      admin: auth,
      acao: 'ATRIBUTO_CRIADO',
      entidade: 'Atributo',
      entidadeId: atributo.id,
      detalhes: {
        nome: atributo.nome,
        polaridade: atributo.polaridade,
        visivel: atributo.visivel,
      },
    });
    return NextResponse.json(atributo);
  } catch {
    return NextResponse.json({ error: 'Erro ao criar atributo' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/atributos
 * Exclui um atributo. Bloqueado se houver avaliacoes vinculadas.
 */
export async function DELETE(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const emUso = await prisma.avaliacao.count({ where: { atributo_id: id } });
    if (emUso > 0) {
      return NextResponse.json(
        { error: `Atributo possui ${emUso} avaliação(ões) vinculada(s) e não pode ser excluído.` },
        { status: 409 }
      );
    }

    const atributo = await prisma.atributo.delete({ where: { id } });
    await recordAuditLog({
      admin: auth,
      acao: 'ATRIBUTO_EXCLUIDO',
      entidade: 'Atributo',
      entidadeId: atributo.id,
      detalhes: { nome: atributo.nome, polaridade: atributo.polaridade },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir atributo' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/atributos
 * Atualiza um atributo existente (nome, descricao, polaridade, visibilidade).
 */
export async function PUT(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { id, nome, descricao, polaridade, icone, visivel } = await req.json();
    const data: Record<string, unknown> = {};
    
    if (nome !== undefined) data.nome = nome;
    if (descricao !== undefined) data.descricao = descricao;
    if (polaridade !== undefined) data.polaridade = polaridade;
    if (icone !== undefined) data.icone = icone;
    if (visivel !== undefined) data.visivel = visivel;

    const atributo = await prisma.atributo.update({
      where: { id },
      data
    });
    await recordAuditLog({
      admin: auth,
      acao: 'ATRIBUTO_ATUALIZADO',
      entidade: 'Atributo',
      entidadeId: atributo.id,
      detalhes: {
        nome: atributo.nome,
        polaridade: atributo.polaridade,
        visivel: atributo.visivel,
        campos: Object.keys(data),
      },
    });
    return NextResponse.json(atributo);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar atributo' }, { status: 500 });
  }
}
