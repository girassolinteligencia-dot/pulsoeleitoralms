import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity, requireAdmin } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';
import { buildPublicCandidateWhere, getPublicScopeConfig } from '@/lib/publicScope';
import { buildSearchOR } from '@/lib/normalize-search';

// GET candidates for admin with pagination
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const scopeConfig = await getPublicScopeConfig();
    const where = buildPublicCandidateWhere(scopeConfig, {
      ...(search && { OR: buildSearchOR(search, ['nome', 'cargo', 'partido', 'cidade']) }),
    });

    const [candidatos, total] = await Promise.all([
      prisma.candidato.findMany({
        where,
        include: { campanha: true },
        orderBy: { nome: 'asc' },
        take: limit,
        skip,
      }),
      prisma.candidato.count({ where }),
    ]);

    return NextResponse.json({
      data: candidatos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao buscar candidatos admin:', error);
    return NextResponse.json({ data: [], total: 0, page: 1, totalPages: 0 }, { status: 200 });
  }
}

// POST create a new candidate
export async function POST(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { nome, partido, numero, cargo, cidade, bairro, foto_url, campanha_id, ano_eleicao, check_only } = body;

    if (!nome?.trim() || !cargo?.trim() || !cidade?.trim() || !campanha_id) {
      return NextResponse.json({ error: 'Campos obrigatórios: nome, cargo, cidade, campanha_id' }, { status: 400 });
    }

    // Verifica duplicidade: mesmo nome normalizado + cargo + cidade em qualquer campanha
    const nomeNorm = nome.trim().toUpperCase();
    const existing = await prisma.candidato.findMany({
      where: {
        nome: { equals: nomeNorm, mode: 'insensitive' },
        cargo: { equals: cargo.trim(), mode: 'insensitive' },
        cidade: { equals: cidade.trim(), mode: 'insensitive' },
      },
      include: { campanha: { select: { nome: true } } },
      take: 5,
    });

    if (existing.length > 0) {
      return NextResponse.json({
        error: 'duplicado',
        message: `Político já cadastrado na plataforma.`,
        existentes: existing.map(c => ({
          id: c.id,
          nome: c.nome,
          cargo: c.cargo,
          cidade: c.cidade,
          partido: c.partido,
          ano_eleicao: c.ano_eleicao,
          campanha: c.campanha.nome,
        })),
      }, { status: 409 });
    }

    // Se check_only=true, apenas verifica sem criar
    if (check_only) return NextResponse.json({ ok: true, message: 'Nenhum duplicado encontrado.' });

    const candidato = await prisma.candidato.create({
      data: {
        nome: nomeNorm,
        partido: partido?.trim() || null,
        numero: numero?.trim() || null,
        cargo: cargo.trim(),
        cidade: cidade.trim(),
        bairro: bairro?.trim() || null,
        foto_url: foto_url?.trim() || null,
        campanha_id,
        ano_eleicao: ano_eleicao ? parseInt(ano_eleicao) : 2026,
      },
    });

    await recordAuditLog({
      admin: auth,
      acao: 'CANDIDATO_CRIADO',
      entidade: 'Candidato',
      entidadeId: candidato.id,
      detalhes: { nome: candidato.nome, cargo: candidato.cargo, cidade: candidato.cidade, campanha_id: candidato.campanha_id },
    });

    return NextResponse.json(candidato, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


// PATCH update a candidate
export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { id, nome, partido, numero, cargo, cidade, foto_url, status_verificacao } = body;

    const candidato = await prisma.candidato.update({
      where: { id },
      data: {
        nome,
        partido,
        numero,
        cargo,
        cidade,
        foto_url,
        ...(status_verificacao !== undefined && { status_verificacao }),
      },
    });
    await recordAuditLog({
      admin: auth,
      acao: 'CANDIDATO_ATUALIZADO',
      entidade: 'Candidato',
      entidadeId: candidato.id,
      detalhes: {
        nome: candidato.nome,
        cargo: candidato.cargo,
        cidade: candidato.cidade,
      },
    });

    return NextResponse.json(candidato);
  } catch (error) {
    console.error('Erro ao atualizar candidato:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
