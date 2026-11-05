import "server-only";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getDb } from "@/server/db/client";
import { adminUsers } from "@/server/db/schema";

// Autenticação do admin via Cloudflare Access.
// O Access protege /admin* e /api/admin* na borda e injeta o JWT assinado no header
// `Cf-Access-Jwt-Assertion`. Validamos assinatura, emissor e audiência aqui também
// (defesa em profundidade) e aplicamos os papéis da tabela admin_users.

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

const DEFAULT_ADMIN_EMAILS = ["girassolinteligencia@gmail.com"];

const normalizeEmail = (email: string) => email.toLowerCase().trim();
const isAdminRole = (v: string): v is AdminRole =>
  ADMIN_ROLES.includes(v as AdminRole);
const fail = (status: number, error: string) => ({
  error: NextResponse.json({ error }, { status }),
});

function bootstrapEmails() {
  const configured = process.env.ADMIN_EMAILS;
  if (!configured) return DEFAULT_ADMIN_EMAILS;
  return configured.split(",").map(normalizeEmail).filter(Boolean);
}

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
let jwksTeam: string | undefined;

function teamDomain() {
  const raw = process.env.CF_ACCESS_TEAM_DOMAIN?.trim();
  if (!raw) return undefined;
  return raw.startsWith("http")
    ? raw.replace(/\/$/, "")
    : `https://${raw.replace(/\/$/, "")}`;
}

/** Valida o JWT do Access e devolve { sub, email }. */
async function verifyAccessJwt(
  req: Request,
): Promise<{ sub: string; email: string } | { error: NextResponse }> {
  // Desenvolvimento local (next dev): sem Access na frente. Nunca ativo em produção.
  if (process.env.NODE_ENV === "development" && process.env.ADMIN_DEV_EMAIL) {
    return { sub: "dev", email: normalizeEmail(process.env.ADMIN_DEV_EMAIL) };
  }

  const team = teamDomain();
  const aud = process.env.CF_ACCESS_AUD?.trim();
  if (!team || !aud) return fail(500, "Cloudflare Access não configurado");

  const token =
    req.headers.get("cf-access-jwt-assertion") ||
    req.headers.get("cookie")?.match(/(?:^|;\s*)CF_Authorization=([^;]+)/)?.[1];
  if (!token) return fail(401, "Authentication required");

  if (!jwks || jwksTeam !== team) {
    jwks = createRemoteJWKSet(new URL(`${team}/cdn-cgi/access/certs`));
    jwksTeam = team;
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: team,
      audience: aud,
    });
    const email =
      typeof payload.email === "string" ? normalizeEmail(payload.email) : "";
    if (!email || !payload.sub) return fail(401, "Invalid session");
    return { sub: payload.sub, email };
  } catch {
    return fail(401, "Invalid session");
  }
}

export async function getAdminIdentity(req: Request): Promise<AuthResult> {
  const auth = await verifyAccessJwt(req);
  if ("error" in auth) return auth;
  const { sub, email } = auth;
  const canBootstrap = bootstrapEmails().includes(email);

  try {
    const db = getDb();
    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (!adminUser && canBootstrap) {
      const [created] = await db
        .insert(adminUsers)
        .values({
          email,
          role: "admin",
          ativo: true,
          ultimo_login_em: new Date(),
        })
        .returning();
      return {
        id: sub,
        email,
        nome: created.nome,
        role: "admin",
        adminUserId: created.id,
      };
    }

    if (!adminUser || !adminUser.ativo) return fail(403, "Admin access denied");

    const role = isAdminRole(adminUser.role) ? adminUser.role : "viewer";
    const last = adminUser.ultimo_login_em?.getTime() ?? 0;
    if (Date.now() - last > 10 * 60 * 1000) {
      await db
        .update(adminUsers)
        .set({ ultimo_login_em: new Date() })
        .where(eq(adminUsers.id, adminUser.id));
    }

    return {
      id: sub,
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
