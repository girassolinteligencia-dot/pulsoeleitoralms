import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity, requireAdmin } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get('categoria') || undefined;

  try {
    const atributos = await prisma.atributo.findMany({
      where: categoria ? { categoria } : undefined,
      orderBy: [{ categoria: 'asc' }, { polaridade: 'desc' }, { nome: 'asc' }],
    });
    return NextResponse.json(atributos);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar atributos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { nome, descricao, polaridade, icone, visivel, categoria } = await req.json();
    const atributo = await prisma.atributo.create({
      data: {
        nome,
        descricao,
        polaridade: Number(polaridade) || 1,
        icone,
        visivel: visivel !== undefined ? visivel : true,
        categoria: categoria || 'politico',
      },
    });
    await recordAuditLog({
      admin: auth,
      acao: 'ATRIBUTO_CRIADO',
      entidade: 'Atributo',
      entidadeId: atributo.id,
      detalhes: { nome: atributo.nome, polaridade: atributo.polaridade, categoria: atributo.categoria },
    });
    return NextResponse.json(atributo);
  } catch {
    return NextResponse.json({ error: 'Erro ao criar atributo' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { id, nome, descricao, polaridade, icone, visivel, categoria } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (nome !== undefined) data.nome = nome;
    if (descricao !== undefined) data.descricao = descricao;
    if (polaridade !== undefined) data.polaridade = Number(polaridade);
    if (icone !== undefined) data.icone = icone;
    if (visivel !== undefined) data.visivel = visivel;
    if (categoria !== undefined) data.categoria = categoria;

    const atributo = await prisma.atributo.update({ where: { id }, data });
    await recordAuditLog({
      admin: auth,
      acao: 'ATRIBUTO_ATUALIZADO',
      entidade: 'Atributo',
      entidadeId: atributo.id,
      detalhes: { nome: atributo.nome, campos: Object.keys(data) },
    });
    return NextResponse.json(atributo);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar atributo' }, { status: 500 });
  }
}

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
      detalhes: { nome: atributo.nome },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir atributo' }, { status: 500 });
  }
}
