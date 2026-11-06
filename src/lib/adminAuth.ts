import "server-only";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { cookieDaRequisicao, lerSessao } from "@/server/adminSession";
import { versaoSenha } from "@/server/senha";
import { getDb } from "@/server/db/client";
import { adminUsers } from "@/server/db/schema";

// Autenticação do admin: e-mail + senha (tabela admin_users) e cookie de sessão assinado
// (src/server/adminSession.ts). Sem Cloudflare Access.

export const ADMIN_ROLES = ["admin", "editor", "viewer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminIdentity = {
  id: string;
  email: string;
  nome?: string | null;
  role: AdminRole;
  adminUserId?: string;
};

type AuthResult = AdminIdentity | { error: NextResponse };

const normalizeEmail = (email: string) => email.toLowerCase().trim();
const isAdminRole = (v: string): v is AdminRole =>
  ADMIN_ROLES.includes(v as AdminRole);
const fail = (status: number, error: string) => ({
  error: NextResponse.json({ error }, { status }),
});

export const isSafeMethod = (m: string) => m === "GET" || m === "HEAD" || m === "OPTIONS";

/** Aceita só requisições do próprio site (Sec-Fetch-Site ou Origin igual ao host). */
export function isSameOrigin(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

export async function getAdminIdentity(req: Request): Promise<AuthResult> {
  // CSRF: toda operação que altera dados exige origem própria (além do SameSite=Strict).
  if (!isSafeMethod(req.method) && !isSameOrigin(req)) {
    return fail(403, "Origem da requisição não permitida");
  }

  const sessao = lerSessao(cookieDaRequisicao(req));
  if (!sessao) return fail(401, "Authentication required");
  const email = normalizeEmail(sessao.email);

  try {
    const db = getDb();
    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (!adminUser || !adminUser.ativo || !adminUser.senha_hash)
      return fail(401, "Authentication required");
    // Senha trocada depois do login: sessão antiga deixa de valer.
    if ((await versaoSenha(adminUser.senha_hash)) !== sessao.v)
      return fail(401, "Authentication required");

    const role = isAdminRole(adminUser.role) ? adminUser.role : "viewer";
    return {
      id: adminUser.id,
      email,
      nome: adminUser.nome,
      role,
      adminUserId: adminUser.id,
    };
  } catch (err) {
    console.error("Erro ao validar usuário administrativo:", err);
    return fail(500, "Erro ao validar acesso administrativo");
  }
}

const roleForbidden = (roles: AdminRole[]) =>
  NextResponse.json(
    { error: `Permissão insuficiente. Requer: ${roles.join(", ")}` },
    { status: 403 },
  );

export async function requireAdmin(req: Request) {
  const result = await getAdminIdentity(req);
  return "error" in result ? result.error : null;
}

export async function requireAdminRole(req: Request, roles: AdminRole[]) {
  const result = await getAdminIdentity(req);
  if ("error" in result) return result.error;
  return roles.includes(result.role) ? null : roleForbidden(roles);
}

export async function getAdminIdentityWithRole(
  req: Request,
  roles: AdminRole[],
): Promise<AuthResult> {
  const result = await getAdminIdentity(req);
  if ("error" in result) return result;
  if (!roles.includes(result.role)) return { error: roleForbidden(roles) };
  return result;
}
