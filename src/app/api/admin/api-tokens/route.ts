import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getAdminIdentityWithRole, requireAdminRole } from "@/lib/adminAuth";
import { recordAuditLog } from "@/lib/auditLog";
import { hashApiToken, maskApiToken } from "@/lib/apiTokens";
import { getDb } from "@/server/db/client";
import { parametrosPlataforma } from "@/server/db/schema";

const GRUPO = "api_tokens";
const readTokenValue = (value: unknown) =>
  (value && typeof value === "object" ? value : {}) as Record<string, unknown>;

async function findToken(id: string) {
  const [p] = await getDb()
    .select()
    .from(parametrosPlataforma)
    .where(
      and(
        eq(parametrosPlataforma.id, id),
        eq(parametrosPlataforma.grupo, GRUPO),
      ),
    )
    .limit(1);
  return p ?? null;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdminRole(req, ["admin"]);
  if (authError) return authError;
  try {
    const params = await getDb()
      .select()
      .from(parametrosPlataforma)
      .where(eq(parametrosPlataforma.grupo, GRUPO))
      .orderBy(desc(parametrosPlataforma.updatedAt));

    return NextResponse.json(
      params.map((p) => {
        const v = readTokenValue(p.valor);
        const tokenPrefix =
          typeof v.tokenPrefix === "string" ? v.tokenPrefix : undefined;
        const legado =
          typeof v.token === "string" && typeof v.tokenHash !== "string";
        return {
          id: p.id,
          chave: p.chave,
          descricao: p.descricao ?? "",
          token: legado
            ? "Token legado em texto — revogue e gere um novo"
            : maskApiToken(tokenPrefix),
          ativo: v.ativo === true,
          legado,
          criado_em: (v.criado_em as string) ?? p.updatedAt,
        };
      }),
    );
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar tokens" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  try {
    const { descricao } = await req.json();
    if (typeof descricao !== "string" || !descricao.trim()) {
      return NextResponse.json(
        { error: "Descrição obrigatória" },
        { status: 400 },
      );
    }
    const token = "pms_" + randomBytes(24).toString("hex");
    const chave = "api_token_" + randomBytes(6).toString("hex");

    const [parametro] = await getDb()
      .insert(parametrosPlataforma)
      .values({
        chave,
        valor: {
          tokenHash: hashApiToken(token),
          tokenPrefix: token.slice(0, 8),
          ativo: true,
          criado_em: new Date().toISOString(),
        },
        grupo: GRUPO,
        descricao: descricao.trim(),
      })
      .returning();

    await recordAuditLog({
      admin: auth,
      acao: "API_TOKEN_CRIADO",
      entidade: "ParametroPlataforma",
      entidadeId: parametro.id,
      detalhes: { descricao: parametro.descricao },
    });
    // O token completo só é exibido na criação
    return NextResponse.json({
      id: parametro.id,
      chave,
      descricao: parametro.descricao,
      token,
      ativo: true,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao criar token" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  try {
    const { id, ativo } = await req.json();
    if (typeof id !== "string" || typeof ativo !== "boolean") {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    const existing = await findToken(id);
    if (!existing)
      return NextResponse.json(
        { error: "Token não encontrado" },
        { status: 404 },
      );

    const valorAtual = readTokenValue(existing.valor);
    const isLegacy =
      typeof valorAtual.token === "string" &&
      typeof valorAtual.tokenHash !== "string";
    if (ativo && isLegacy) {
      return NextResponse.json(
        { error: "Token legado não pode ser reativado. Gere um novo token." },
        { status: 409 },
      );
    }

    await getDb()
      .update(parametrosPlataforma)
      .set({ valor: { ...valorAtual, ativo }, updatedAt: new Date() })
      .where(eq(parametrosPlataforma.id, id));

    await recordAuditLog({
      admin: auth,
      acao: ativo ? "API_TOKEN_ATIVADO" : "API_TOKEN_REVOGADO",
      entidade: "ParametroPlataforma",
      entidadeId: id,
      detalhes: { descricao: existing.descricao },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar token" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    const existing = await findToken(id);
    if (!existing)
      return NextResponse.json(
        { error: "Token não encontrado" },
        { status: 404 },
      );

    await getDb()
      .delete(parametrosPlataforma)
      .where(eq(parametrosPlataforma.id, id));
    await recordAuditLog({
      admin: auth,
      acao: "API_TOKEN_EXCLUIDO",
      entidade: "ParametroPlataforma",
      entidadeId: id,
      detalhes: { descricao: existing.descricao },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao excluir token" },
      { status: 500 },
    );
  }
}
