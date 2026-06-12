import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminIdentity, requireAdmin } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const bloqueios = await prisma.bloqueio.findMany({
      orderBy: { criado_em: 'desc' }
    });
    return NextResponse.json(bloqueios);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { hash, motivo, expira_em } = await req.json();
    const bloqueio = await prisma.bloqueio.create({
      data: { hash, motivo, expira_em: expira_em ? new Date(expira_em) : null }
    });
    await recordAuditLog({
      admin: auth,
      acao: 'BLOQUEIO_CRIADO',
      entidade: 'Bloqueio',
      entidadeId: bloqueio.id,
      detalhes: {
        motivo: bloqueio.motivo,
        expira_em: bloqueio.expira_em,
      },
    });
    return NextResponse.json(bloqueio);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await req.json();
    const bloqueio = await prisma.bloqueio.delete({ where: { id } });
    await recordAuditLog({
      admin: auth,
      acao: 'BLOQUEIO_REMOVIDO',
      entidade: 'Bloqueio',
      entidadeId: bloqueio.id,
      detalhes: {
        motivo: bloqueio.motivo,
        expira_em: bloqueio.expira_em,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
