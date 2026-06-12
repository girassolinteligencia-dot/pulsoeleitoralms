import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity, requireAdmin } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';
import { getFotoUrl } from '@/lib/supabase';
import { buildSearchOR } from '@/lib/normalize-search';

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
      ...(search && { OR: buildSearchOR(search, ['nome', 'tipo', 'cidade']) }),
    };

    const [servicos, total] = await Promise.all([
      prisma.servicoPublico.findMany({
        where,
        include: { campanha: { select: { id: true, nome: true } } },
        orderBy: [{ cidade: 'asc' }, { nome: 'asc' }],
        take: limit,
        skip,
      }),
      prisma.servicoPublico.count({ where }),
    ]);

    return NextResponse.json({ data: servicos.map(s => ({ ...s, foto_url: getFotoUrl(s.foto_url) })), total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Erro ao buscar serviços admin:', error);
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

    const servico = await prisma.servicoPublico.create({
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
      acao: 'SERVICO_CRIADO',
      entidade: 'ServicoPublico',
      entidadeId: servico.id,
      detalhes: { nome: servico.nome, tipo: servico.tipo, cidade: servico.cidade },
    });

    return NextResponse.json(servico, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { id, nome, tipo, cidade, uf, descricao, foto_url, campanha_id, status } = body;

    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

    const servico = await prisma.servicoPublico.update({
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
      acao: 'SERVICO_ATUALIZADO',
      entidade: 'ServicoPublico',
      entidadeId: servico.id,
      detalhes: { nome: servico.nome, tipo: servico.tipo, cidade: servico.cidade },
    });

    return NextResponse.json(servico);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

  try {
    const servico = await prisma.servicoPublico.delete({ where: { id } });
    await recordAuditLog({
      admin: auth,
      acao: 'SERVICO_REMOVIDO',
      entidade: 'ServicoPublico',
      entidadeId: servico.id,
      detalhes: { nome: servico.nome },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao remover serviço:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
