import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity, requireAdmin } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';
import { buildPublicCandidateWhere, getPublicScopeConfig } from '@/lib/publicScope';

// GET campanhas for admin with pagination
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where = search
      ? {
          nome: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {};

    const scopeConfig = await getPublicScopeConfig();
    const [campanhas, total] = await Promise.all([
      prisma.campanha.findMany({
        where,
        include: {
          _count: {
            select: { candidatos: true, atributos: true },
          },
        },
        orderBy: { data_inicio: 'desc' },
        take: limit,
        skip,
      }),
      prisma.campanha.count({ where }),
    ]);
    const campanhasComEscopo = await Promise.all(
      campanhas.map(async (campanha) => {
        const candidatosPublicos = await prisma.candidato.count({
          where: buildPublicCandidateWhere(scopeConfig, { campanha_id: campanha.id }),
        });
        const selecionadaNoEscopo = scopeConfig.mode === 'all_active'
          || scopeConfig.campanhasAtivas.includes(campanha.id);

        return {
          ...campanha,
          public_scope: {
            visivel: campanha.status === 'ativo' && selecionadaNoEscopo && candidatosPublicos > 0,
            candidatos_visiveis: candidatosPublicos,
            modo: scopeConfig.mode,
            anos_ativos: scopeConfig.anosAtivos,
            selecionada: selecionadaNoEscopo,
          },
        };
      })
    );

    return NextResponse.json({
      data: campanhasComEscopo,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao buscar campanhas admin:', error);
    return NextResponse.json(
      { data: [], total: 0, page: 1, totalPages: 0 },
      { status: 200 }
    );
  }
}

// POST create a new campanha
export async function POST(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { nome, slug, status, data_fim, meta_config } = body;

    if (!nome || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      );
    }

    const campanha = await prisma.campanha.create({
      data: {
        nome,
        slug,
        status: status || 'ativo',
        data_fim: data_fim ? new Date(data_fim) : null,
        meta_config: meta_config || null,
      },
    });
    await recordAuditLog({
      admin: auth,
      acao: 'CAMPANHA_CRIADA',
      entidade: 'Campanha',
      entidadeId: campanha.id,
      detalhes: {
        nome: campanha.nome,
        slug: campanha.slug,
        status: campanha.status,
      },
    });

    return NextResponse.json(campanha);
  } catch (error) {
    console.error('Erro ao criar campanha:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar campanha' },
      { status: 500 }
    );
  }
}

// DELETE campanha — só permitido se sem votos e sem candidatos
export async function DELETE(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const campanha = await prisma.campanha.findUnique({
      where: { id },
      include: { _count: { select: { candidatos: true } } },
    });
    if (!campanha) return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 });

    if (campanha.total_votos > 0 || campanha._count.candidatos > 0) {
      return NextResponse.json(
        { error: 'Ciclo com dados não pode ser excluído. Use "Encerrar" para arquivá-lo.' },
        { status: 409 }
      );
    }

    await prisma.campanha.delete({ where: { id } });
    await recordAuditLog({
      admin: auth,
      acao: 'CAMPANHA_EXCLUIDA',
      entidade: 'Campanha',
      entidadeId: id,
      detalhes: { nome: campanha.nome, slug: campanha.slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir campanha:', error);
    return NextResponse.json({ error: 'Erro interno ao excluir campanha' }, { status: 500 });
  }
}

// PATCH update a campanha
export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    if (updateData.data_fim) {
      updateData.data_fim = new Date(updateData.data_fim);
    }

    const campanha = await prisma.campanha.update({
      where: { id },
      data: updateData,
    });
    await recordAuditLog({
      admin: auth,
      acao: 'CAMPANHA_ATUALIZADA',
      entidade: 'Campanha',
      entidadeId: campanha.id,
      detalhes: {
        nome: campanha.nome,
        slug: campanha.slug,
        status: campanha.status,
        campos: Object.keys(updateData),
      },
    });

    return NextResponse.json(campanha);
  } catch (error) {
    console.error('Erro ao atualizar campanha:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar campanha' },
      { status: 500 }
    );
  }
}
