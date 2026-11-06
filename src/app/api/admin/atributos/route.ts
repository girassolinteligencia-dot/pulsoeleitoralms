import { NextRequest, NextResponse } from "next/server";
import { asc, count, desc, eq } from "drizzle-orm";
import { getAdminIdentityWithRole, requireAdmin } from "@/lib/adminAuth";
import { recordAuditLog } from "@/lib/auditLog";
import { getDb } from "@/server/db/client";
import { atributos, avaliacoes, campanhaAtributos } from "@/server/db/schema";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const categoria = req.nextUrl.searchParams.get("categoria") || undefined;
  try {
    const rows = await getDb()
      .select()
      .from(atributos)
      .where(categoria ? eq(atributos.categoria, categoria) : undefined)
      .orderBy(
        asc(atributos.categoria),
        desc(atributos.polaridade),
        asc(atributos.nome),
      );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar atributos" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
  if ("error" in auth) return auth.error;
  try {
    const { nome, descricao, polaridade, icone, visivel, categoria } =
      await req.json();
    if (typeof nome !== "string" || !nome.trim()) {
      return NextResponse.json({ error: "nome obrigatório" }, { status: 400 });
    }
    const [atributo] = await getDb()
      .insert(atributos)
      .values({
        nome: nome.trim(),
        descricao: descricao ?? null,
        polaridade: Number(polaridade) === -1 ? -1 : 1,
        icone: icone ?? null,
        visivel: visivel !== undefined ? Boolean(visivel) : true,
        categoria: categoria || "politico",
      })
      .returning();
    await recordAuditLog({
      admin: auth,
      acao: "ATRIBUTO_CRIADO",
      entidade: "Atributo",
      entidadeId: atributo.id,
      detalhes: {
        nome: atributo.nome,
        polaridade: atributo.polaridade,
        categoria: atributo.categoria,
      },
    });
    return NextResponse.json(atributo);
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar atributo" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
  if ("error" in auth) return auth.error;
  try {
    const { id, nome, descricao, polaridade, icone, visivel, categoria } =
      await req.json();
    if (!id)
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const set: Partial<typeof atributos.$inferInsert> = {};
    if (nome !== undefined) set.nome = String(nome);
    if (descricao !== undefined) set.descricao = descricao;
    if (polaridade !== undefined) set.polaridade = Number(polaridade);
    if (icone !== undefined) set.icone = icone;
    if (visivel !== undefined) set.visivel = Boolean(visivel);
    if (categoria !== undefined) set.categoria = String(categoria);
    if (Object.keys(set).length === 0)
      return NextResponse.json({ error: "Nada a atualizar" }, { status: 400 });

    const [atributo] = await getDb()
      .update(atributos)
      .set(set)
      .where(eq(atributos.id, String(id)))
      .returning();
    if (!atributo)
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    await recordAuditLog({
      admin: auth,
      acao: "ATRIBUTO_ATUALIZADO",
      entidade: "Atributo",
      entidadeId: atributo.id,
      detalhes: { nome: atributo.nome, campos: Object.keys(set) },
    });
    return NextResponse.json(atributo);
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar atributo" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    const db = getDb();

    const [{ n: emUso }] = await db
      .select({ n: count() })
      .from(avaliacoes)
      .where(eq(avaliacoes.atributo_id, String(id)));
    if (emUso > 0) {
      return NextResponse.json(
        {
          error: `Atributo possui ${emUso} avaliação(ões) vinculada(s) e não pode ser excluído.`,
        },
        { status: 409 },
      );
    }

    // remove vínculos com campanhas antes (FK)
    const [, deleted] = await db.batch([
      db
        .delete(campanhaAtributos)
        .where(eq(campanhaAtributos.atributo_id, String(id))),
      db
        .delete(atributos)
        .where(eq(atributos.id, String(id)))
        .returning(),
    ]);
    const atributo = deleted[0];
    if (!atributo)
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    await recordAuditLog({
      admin: auth,
      acao: "ATRIBUTO_EXCLUIDO",
      entidade: "Atributo",
      entidadeId: atributo.id,
      detalhes: { nome: atributo.nome },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao excluir atributo" },
      { status: 500 },
    );
  }
}
