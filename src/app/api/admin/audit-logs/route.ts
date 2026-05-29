import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

function parseOptionalDate(value: string | null, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const acao = searchParams.get('acao') || '';
    const entidade = searchParams.get('entidade') || '';
    const search = searchParams.get('search')?.trim() || '';
    const inicio = parseOptionalDate(searchParams.get('inicio'));
    const fim = parseOptionalDate(searchParams.get('fim'), true);
    const skip = (page - 1) * limit;

    const where = {
      ...(acao && { acao }),
      ...(entidade && { entidade }),
      ...((inicio || fim) && {
        criado_em: {
          ...(inicio && { gte: inicio }),
          ...(fim && { lte: fim }),
        },
      }),
      ...(search && {
        OR: [
          { acao: { contains: search, mode: 'insensitive' as const } },
          { entidade: { contains: search, mode: 'insensitive' as const } },
          { entidade_id: { contains: search, mode: 'insensitive' as const } },
          { usuario_id: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [logs, total, acoes, entidades] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { criado_em: 'desc' },
        take: limit,
        skip,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        distinct: ['acao'],
        select: { acao: true },
        orderBy: { acao: 'asc' },
      }),
      prisma.auditLog.findMany({
        distinct: ['entidade'],
        select: { entidade: true },
        orderBy: { entidade: 'asc' },
      }),
    ]);

    return NextResponse.json({
      data: logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      filters: {
        acoes: acoes.map((item) => item.acao),
        entidades: entidades.map((item) => item.entidade),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar AuditLog:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar auditoria' }, { status: 500 });
  }
}
