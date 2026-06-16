import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ADMIN_ROLES, AdminRole, getAdminIdentityWithRole } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/auditLog';

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function parseRole(role: unknown): AdminRole | null {
  return typeof role === 'string' && ADMIN_ROLES.includes(role as AdminRole)
    ? role as AdminRole
    : null;
}

function serializeAdminUser(user: {
  id: string;
  email: string;
  nome: string | null;
  role: string;
  ativo: boolean;
  ultimo_login_em: Date | null;
  criado_em: Date;
  atualizado_em: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    nome: user.nome,
    role: user.role,
    ativo: user.ativo,
    ultimo_login_em: user.ultimo_login_em,
    criado_em: user.criado_em,
    atualizado_em: user.atualizado_em,
  };
}

async function wouldRemoveLastActiveAdmin(id: string, nextRole: AdminRole, nextAtivo: boolean) {
  if (nextRole === 'admin' && nextAtivo) return false;

  const activeAdmins = await prisma.adminUser.count({
    where: {
      role: 'admin',
      ativo: true,
      id: { not: id },
    },
  });

  return activeAdmins === 0;
}

export async function GET(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ['admin']);
  if ('error' in auth) return auth.error;

  try {
    const users = await prisma.adminUser.findMany({
      orderBy: [
        { ativo: 'desc' },
        { role: 'asc' },
        { email: 'asc' },
      ],
    });

    return NextResponse.json({ data: users.map(serializeAdminUser) });
  } catch (error) {
    console.error('Erro ao listar usuários administrativos:', error);
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ['admin']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
    const nome = typeof body.nome === 'string' && body.nome.trim() ? body.nome.trim() : null;
    const role = parseRole(body.role) || 'viewer';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail válido é obrigatório' }, { status: 400 });
    }

    const user = await prisma.adminUser.create({
      data: { email, nome, role, ativo: true },
    });

    await recordAuditLog({
      admin: auth,
      acao: 'ADMIN_USER_CREATED',
      entidade: 'AdminUser',
      entidadeId: user.id,
      detalhes: { email: user.email, nome: user.nome, role: user.role, ativo: user.ativo },
    });

    return NextResponse.json(serializeAdminUser(user), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um usuário administrativo com este e-mail' }, { status: 409 });
    }

    console.error('Erro ao criar usuário administrativo:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ['admin']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const current = await prisma.adminUser.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const nextRole = parseRole(body.role) || current.role as AdminRole;
    const nextAtivo = typeof body.ativo === 'boolean' ? body.ativo : current.ativo;

    if (auth.adminUserId === id && (!nextAtivo || nextRole !== 'admin')) {
      return NextResponse.json(
        { error: 'Você não pode remover sua própria permissão de administrador' },
        { status: 409 }
      );
    }

    if (await wouldRemoveLastActiveAdmin(id, nextRole, nextAtivo)) {
      return NextResponse.json(
        { error: 'Mantenha pelo menos um administrador ativo' },
        { status: 409 }
      );
    }

    const updateData: Prisma.AdminUserUpdateInput = {};
    if (typeof body.nome === 'string') updateData.nome = body.nome.trim() || null;
    if (typeof body.role === 'string') updateData.role = nextRole;
    if (typeof body.ativo === 'boolean') updateData.ativo = nextAtivo;

    const user = await prisma.adminUser.update({
      where: { id },
      data: updateData,
    });

    await recordAuditLog({
      admin: auth,
      acao: 'ADMIN_USER_UPDATED',
      entidade: 'AdminUser',
      entidadeId: user.id,
      detalhes: {
        email: user.email,
        antes: { nome: current.nome, role: current.role, ativo: current.ativo },
        depois: { nome: user.nome, role: user.role, ativo: user.ativo },
      },
    });

    return NextResponse.json(serializeAdminUser(user));
  } catch (error) {
    console.error('Erro ao atualizar usuário administrativo:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ['admin']);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const current = await prisma.adminUser.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    if (auth.adminUserId === id) {
      return NextResponse.json(
        { error: 'Você não pode desativar seu próprio usuário' },
        { status: 409 }
      );
    }

    if (await wouldRemoveLastActiveAdmin(id, current.role as AdminRole, false)) {
      return NextResponse.json(
        { error: 'Mantenha pelo menos um administrador ativo' },
        { status: 409 }
      );
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data: { ativo: false },
    });

    await recordAuditLog({
      admin: auth,
      acao: 'ADMIN_USER_DISABLED',
      entidade: 'AdminUser',
      entidadeId: user.id,
      detalhes: { email: user.email, role: user.role },
    });

    return NextResponse.json(serializeAdminUser(user));
  } catch (error) {
    console.error('Erro ao desativar usuário administrativo:', error);
    return NextResponse.json({ error: 'Erro ao desativar usuário' }, { status: 500 });
  }
}
