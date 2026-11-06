import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, desc, eq, ne } from "drizzle-orm";
import {
  ADMIN_ROLES,
  AdminRole,
  getAdminIdentityWithRole,
} from "@/lib/adminAuth";
import { recordAuditLog } from "@/lib/auditLog";
import { getDb } from "@/server/db/client";
import { adminUsers } from "@/server/db/schema";

import { gerarHashSenha, validarSenhaNova } from "@/server/senha";

// Login do admin: e-mail + senha definidos aqui (hash PBKDF2; a senha nunca é devolvida).

const normalizeEmail = (email: string) => email.toLowerCase().trim();
const parseRole = (role: unknown): AdminRole | null =>
  typeof role === "string" && ADMIN_ROLES.includes(role as AdminRole)
    ? (role as AdminRole)
    : null;

type AdminUserRow = typeof adminUsers.$inferSelect;
const serialize = (u: AdminUserRow) => ({
  id: u.id,
  email: u.email,
  nome: u.nome,
  role: u.role,
  ativo: u.ativo,
  tem_senha: !!u.senha_hash,
  ultimo_login_em: u.ultimo_login_em,
  criado_em: u.criado_em,
  atualizado_em: u.atualizado_em,
});

async function wouldRemoveLastActiveAdmin(
  id: string,
  nextRole: AdminRole,
  nextAtivo: boolean,
) {
  if (nextRole === "admin" && nextAtivo) return false;
  const [{ n }] = await getDb()
    .select({ n: count() })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.role, "admin"),
        eq(adminUsers.ativo, true),
        ne(adminUsers.id, id),
      ),
    );
  return n === 0;
}

async function findById(id: string) {
  const [u] = await getDb()
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);
  return u ?? null;
}

export async function GET(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  try {
    const users = await getDb()
      .select()
      .from(adminUsers)
      .orderBy(
        desc(adminUsers.ativo),
        asc(adminUsers.role),
        asc(adminUsers.email),
      );
    return NextResponse.json({ data: users.map(serialize) });
  } catch (error) {
    console.error("Erro ao listar usuários administrativos:", error);
    return NextResponse.json(
      { error: "Erro ao listar usuários" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const email =
      typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const nome =
      typeof body.nome === "string" && body.nome.trim()
        ? body.nome.trim()
        : null;
    const role = parseRole(body.role) || "viewer";
    const erroSenha = validarSenhaNova(body.senha);
    if (erroSenha)
      return NextResponse.json({ error: erroSenha }, { status: 400 });
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json(
        { error: "E-mail válido é obrigatório" },
        { status: 400 },
      );
    }

    const db = getDb();
    const [existente] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);
    if (existente) {
      return NextResponse.json(
        { error: "Já existe um usuário administrativo com este e-mail" },
        { status: 409 },
      );
    }

    const [user] = await db
      .insert(adminUsers)
      .values({
        email,
        nome,
        role,
        ativo: true,
        senha_hash: await gerarHashSenha(body.senha),
      })
      .returning();
    await recordAuditLog({
      admin: auth,
      acao: "ADMIN_USER_CREATED",
      entidade: "AdminUser",
      entidadeId: user.id,
      detalhes: {
        email: user.email,
        nome: user.nome,
        role: user.role,
        ativo: user.ativo,
      },
    });
    return NextResponse.json(serialize(user), { status: 201 });
  } catch (error) {
    console.error("Erro ao criar usuário administrativo:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id)
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

    const current = await findById(id);
    if (!current)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    const nextRole = parseRole(body.role) || (current.role as AdminRole);
    const nextAtivo =
      typeof body.ativo === "boolean" ? body.ativo : current.ativo;

    if (auth.adminUserId === id && (!nextAtivo || nextRole !== "admin")) {
      return NextResponse.json(
        {
          error: "Você não pode remover sua própria permissão de administrador",
        },
        { status: 409 },
      );
    }
    if (await wouldRemoveLastActiveAdmin(id, nextRole, nextAtivo)) {
      return NextResponse.json(
        { error: "Mantenha pelo menos um administrador ativo" },
        { status: 409 },
      );
    }

    const set: Partial<typeof adminUsers.$inferInsert> = {};
    if (typeof body.nome === "string") set.nome = body.nome.trim() || null;
    if (typeof body.role === "string") set.role = nextRole;
    if (typeof body.ativo === "boolean") set.ativo = nextAtivo;
    if (body.senha !== undefined) {
      const erroSenha = validarSenhaNova(body.senha);
      if (erroSenha)
        return NextResponse.json({ error: erroSenha }, { status: 400 });
      set.senha_hash = await gerarHashSenha(body.senha);
    }
    if (Object.keys(set).length === 0)
      return NextResponse.json(serialize(current));

    const [user] = await getDb()
      .update(adminUsers)
      .set(set)
      .where(eq(adminUsers.id, id))
      .returning();
    await recordAuditLog({
      admin: auth,
      acao: "ADMIN_USER_UPDATED",
      entidade: "AdminUser",
      entidadeId: user.id,
      detalhes: {
        email: user.email,
        antes: { nome: current.nome, role: current.role, ativo: current.ativo },
        depois: { nome: user.nome, role: user.role, ativo: user.ativo },
        senha_alterada: body.senha !== undefined,
      },
    });
    return NextResponse.json(serialize(user));
  } catch (error) {
    console.error("Erro ao atualizar usuário administrativo:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  try {
    const id = req.nextUrl.searchParams.get("id") || "";
    if (!id)
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

    const current = await findById(id);
    if (!current)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    if (auth.adminUserId === id) {
      return NextResponse.json(
        { error: "Você não pode desativar seu próprio usuário" },
        { status: 409 },
      );
    }
    if (
      await wouldRemoveLastActiveAdmin(id, current.role as AdminRole, false)
    ) {
      return NextResponse.json(
        { error: "Mantenha pelo menos um administrador ativo" },
        { status: 409 },
      );
    }

    const [user] = await getDb()
      .update(adminUsers)
      .set({ ativo: false })
      .where(eq(adminUsers.id, id))
      .returning();
    await recordAuditLog({
      admin: auth,
      acao: "ADMIN_USER_DISABLED",
      entidade: "AdminUser",
      entidadeId: user.id,
      detalhes: { email: user.email, role: user.role },
    });
    return NextResponse.json(serialize(user));
  } catch (error) {
    console.error("Erro ao desativar usuário administrativo:", error);
    return NextResponse.json(
      { error: "Erro ao desativar usuário" },
      { status: 500 },
    );
  }
}
