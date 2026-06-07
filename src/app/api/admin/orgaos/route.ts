import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity, requireAdmin } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';
  const skip = (page - 1) * limit;

  try {
    const where = {
      ...(search && {
        OR: [
          { nome: { contains: search, mode: 'insensitive' as const } },
          { tipo: { contains: search, mode: 'insensitive' as const } },
          { cidade: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [orgaos, total] = await Promise.all([
      prisma.orgaoPublico.findMany({
        where,
        include: { campanha: { select: { id: true, nome: true } } },
        orderBy: [{ cidade: 'asc' }, { nome: 'asc' }],
        take: limit,
        skip,
      }),
      prisma.orgaoPublico.count({ where }),
    ]);

    return NextResponse.json({
      data: orgaos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao buscar órgãos admin:', error);
    return NextResponse.json({ data: [], total: 0, page: 1, totalPages: 0 }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { nome, tipo, cidade, uf, descricao, foto_url, campanha_id } = body;

    if (!nome?.trim() || !tipo?.trim() || !cidade?.trim()) {
      return NextResponse.json({ error: 'Campos obrigatórios: nome, tipo, cidade' }, { status: 400 });
    }

    const orgao = await prisma.orgaoPublico.create({
      data: {
        nome: nome.trim(),
        tipo: tipo.trim(),
        cidade: cidade.trim(),
        uf: (uf || 'MS').trim().toUpperCase().slice(0, 2),
        descricao: descricao?.trim() || null,
        foto_url: foto_url?.trim() || null,
        campanha_id: campanha_id || null,
      },
    });

    await recordAuditLog({
      admin: auth,
      acao: 'ORGAO_CRIADO',
      entidade: 'OrgaoPublico',
      entidadeId: orgao.id,
      detalhes: { nome: orgao.nome, tipo: orgao.tipo, cidade: orgao.cidade },
    });

    return NextResponse.json(orgao, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar órgão:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { id, nome, tipo, cidade, uf, descricao, foto_url, campanha_id, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
    }

    const orgao = await prisma.orgaoPublico.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome: nome.trim() }),
        ...(tipo !== undefined && { tipo: tipo.trim() }),
        ...(cidade !== undefined && { cidade: cidade.trim() }),
        ...(uf !== undefined && { uf: uf.trim().toUpperCase().slice(0, 2) }),
        ...(descricao !== undefined && { descricao: descricao?.trim() || null }),
        ...(foto_url !== undefined && { foto_url: foto_url?.trim() || null }),
        ...(campanha_id !== undefined && { campanha_id: campanha_id || null }),
        ...(status !== undefined && { status }),
      },
    });

    await recordAuditLog({
      admin: auth,
      acao: 'ORGAO_ATUALIZADO',
      entidade: 'OrgaoPublico',
      entidadeId: orgao.id,
      detalhes: { nome: orgao.nome, tipo: orgao.tipo, cidade: orgao.cidade },
    });

    return NextResponse.json(orgao);
  } catch (error) {
    console.error('Erro ao atualizar órgão:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
  }

  try {
    const orgao = await prisma.orgaoPublico.delete({ where: { id } });

    await recordAuditLog({
      admin: auth,
      acao: 'ORGAO_REMOVIDO',
      entidade: 'OrgaoPublico',
      entidadeId: orgao.id,
      detalhes: { nome: orgao.nome },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao remover órgão:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
