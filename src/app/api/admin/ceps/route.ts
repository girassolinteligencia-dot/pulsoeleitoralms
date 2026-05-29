import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function parsePositiveInt(value: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function normalizeText(value: unknown, maxLength = 120) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export async function GET(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = parsePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const search = normalizeText(searchParams.get('search') || '', 80);
    const status = searchParams.get('status') || 'todos';

    const where: Prisma.CepMsWhereInput = {
      ...(search && {
        OR: [
          { cep: { contains: search } },
          { cidade: { contains: search, mode: 'insensitive' } },
          { bairro: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    if (status === 'ambiguos') {
      where.localidades_count = { gt: 1 };
    } else if (status === 'baixa-confianca') {
      where.bairro_confianca = { lt: 0.8 };
    } else if (status === 'revisados') {
      where.origem = { contains: 'revisado', mode: 'insensitive' };
    }

    const [data, total, summaryRows] = await Promise.all([
      prisma.cepMs.findMany({
        where,
        orderBy: [
          { bairro_confianca: 'asc' },
          { localidades_count: 'desc' },
          { cep: 'asc' },
        ],
        take: limit,
        skip,
      }),
      prisma.cepMs.count({ where }),
      prisma.cepMs.aggregate({
        _count: { cep: true },
        _avg: { bairro_confianca: true },
        _max: { importado_em: true },
      }),
    ]);

    const [ambiguos, baixaConfianca, revisados] = await Promise.all([
      prisma.cepMs.count({ where: { localidades_count: { gt: 1 } } }),
      prisma.cepMs.count({ where: { bairro_confianca: { lt: 0.8 } } }),
      prisma.cepMs.count({ where: { origem: { contains: 'revisado', mode: 'insensitive' } } }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: {
        total: summaryRows._count.cep,
        ambiguos,
        baixaConfianca,
        revisados,
        confiancaMedia: summaryRows._avg.bairro_confianca || 0,
        importadoEm: summaryRows._max.importado_em,
      },
    });
  } catch (error) {
    console.error('Erro ao listar CEPs MS:', error);
    return NextResponse.json({ error: 'Erro ao listar CEPs.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const cep = normalizeText(body.cep, 8).replace(/\D/g, '');
    const bairro = normalizeText(body.bairro, 120);

    if (!/^\d{8}$/.test(cep) || !bairro) {
      return NextResponse.json({ error: 'CEP e bairro são obrigatórios.' }, { status: 400 });
    }

    const current = await prisma.cepMs.findUnique({ where: { cep } });
    if (!current) {
      return NextResponse.json({ error: 'CEP não encontrado.' }, { status: 404 });
    }

    const updated = await prisma.cepMs.update({
      where: { cep },
      data: {
        bairro,
        bairro_confianca: 1,
        origem: current.origem.includes('revisado') ? current.origem : `${current.origem}_revisado`,
      },
    });

    await recordAuditLog({
      admin: auth,
      acao: 'CEP_MS_REVISADO',
      entidade: 'CepMs',
      entidadeId: cep,
      detalhes: {
        cep,
        cidade: updated.cidade,
        bairro_anterior: current.bairro,
        bairro_revisado: updated.bairro,
        origem_anterior: current.origem,
        origem_atual: updated.origem,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao revisar CEP MS:', error);
    return NextResponse.json({ error: 'Erro ao revisar CEP.' }, { status: 500 });
  }
}
