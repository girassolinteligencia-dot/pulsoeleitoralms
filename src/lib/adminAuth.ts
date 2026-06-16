import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const ADMIN_ROLES = ['admin', 'editor', 'viewer'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminIdentity = {
  id: string;
  email: string;
  nome?: string | null;
  role: AdminRole;
  adminUserId?: string;
};

const DEFAULT_ADMIN_EMAILS = [
  'girassolinteligencia@gmail.com',
];

function getAllowedEmails() {
  const configured = process.env.ADMIN_EMAILS;
  if (!configured) return DEFAULT_ADMIN_EMAILS;

  return configured
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function isAdminRole(value: string): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole);
}

function roleForbidden(roles: AdminRole[]) {
  return NextResponse.json(
    { error: `Permissão insuficiente. Requer: ${roles.join(', ')}` },
    { status: 403 }
  );
}

export async function requireAdmin(req: Request) {
  const result = await getAdminIdentity(req);
  return 'error' in result ? result.error : null;
}

export async function requireAdminRole(req: Request, roles: AdminRole[]) {
  const result = await getAdminIdentity(req);
  if ('error' in result) return result.error;
  return roles.includes(result.role) ? null : roleForbidden(roles);
}

export async function getAdminIdentityWithRole(
  req: Request,
  roles: AdminRole[]
): Promise<AdminIdentity | { error: NextResponse }> {
  const result = await getAdminIdentity(req);
  if ('error' in result) return result;
  if (!roles.includes(result.role)) return { error: roleForbidden(roles) };
  return result;
}

export async function getAdminIdentity(req: Request): Promise<AdminIdentity | { error: NextResponse }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: NextResponse.json({ error: 'Auth server is not configured' }, { status: 500 }) };
  }

  if (!token) {
    return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  const userId = data.user?.id;
  const email = data.user?.email ? normalizeEmail(data.user.email) : undefined;

  if (error || !userId || !email) {
    return { error: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) };
  }

  const allowedBootstrapEmails = getAllowedEmails();
  const canBootstrap = allowedBootstrapEmails.includes(email);

  try {
    const adminUser = await prisma.adminUser.findUnique({ where: { email } });

    if (!adminUser && canBootstrap) {
      const created = await prisma.adminUser.create({
        data: {
          email,
          nome: data.user.user_metadata?.name || data.user.user_metadata?.full_name || null,
          role: 'admin',
          ativo: true,
          ultimo_login_em: new Date(),
        },
      });

      return {
        id: userId,
        email,
        nome: created.nome,
        role: 'admin',
        adminUserId: created.id,
      };
    }

    if (!adminUser || !adminUser.ativo) {
      return { error: NextResponse.json({ error: 'Admin access denied' }, { status: 403 }) };
    }

    const role = isAdminRole(adminUser.role) ? adminUser.role : 'viewer';
    const shouldTouchLogin = !adminUser.ultimo_login_em
      || Date.now() - adminUser.ultimo_login_em.getTime() > 10 * 60 * 1000;

    if (shouldTouchLogin) {
      await prisma.adminUser.update({
        where: { id: adminUser.id },
        data: { ultimo_login_em: new Date() },
      });
    }

    return {
      id: userId,
      email,
      nome: adminUser.nome,
      role,
      adminUserId: adminUser.id,
    };
  } catch (err) {
    if (canBootstrap && err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
      return { id: userId, email, role: 'admin' };
    }

    console.error('Erro ao validar usuário administrativo:', err);
    return { error: NextResponse.json({ error: 'Erro ao validar acesso administrativo' }, { status: 500 }) };
  }
}
