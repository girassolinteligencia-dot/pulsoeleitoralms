import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity, requireAdmin } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const parametros = await prisma.parametroPlataforma.findMany({
      orderBy: { grupo: 'asc' }
    });
    return NextResponse.json(parametros);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar parâmetros' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { chave, valor, grupo, descricao } = await req.json();

    const parametro = await prisma.parametroPlataforma.upsert({
      where: { chave },
      update: { valor, grupo, descricao },
      create: { chave, valor, grupo, descricao }
    });
    await recordAuditLog({
      admin: auth,
      acao: 'PARAMETRO_SALVO',
      entidade: 'ParametroPlataforma',
      entidadeId: parametro.id,
      detalhes: {
        chave: parametro.chave,
        grupo: parametro.grupo,
        descricao: parametro.descricao,
      },
    });

    return NextResponse.json(parametro);
  } catch {
    return NextResponse.json({ error: 'Erro ao salvar parâmetro' }, { status: 500 });
  }
}
