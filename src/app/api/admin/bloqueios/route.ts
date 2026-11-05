import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getAdminIdentityWithRole, requireAdmin } from "@/lib/adminAuth";
import { recordAuditLog } from "@/lib/auditLog";
import { getDb } from "@/server/db/client";
import { bloqueios } from "@/server/db/schema";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  try {
    return NextResponse.json(
      await getDb().select().from(bloqueios).orderBy(desc(bloqueios.criado_em)),
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  try {
    const { hash, motivo, expira_em } = await req.json();
    if (typeof hash !== "string" || !hash) {
      return NextResponse.json({ error: "hash obrigatório" }, { status: 400 });
    }
    const [bloqueio] = await getDb()
      .insert(bloqueios)
      .values({
        hash,
        motivo: motivo ?? null,
        expira_em: expira_em ? new Date(expira_em) : null,
      })
      .returning();
    await recordAuditLog({
      admin: auth,
      acao: "BLOQUEIO_CRIADO",
      entidade: "Bloqueio",
      entidadeId: bloqueio.id,
      detalhes: { motivo: bloqueio.motivo, expira_em: bloqueio.expira_em },
    });
    return NextResponse.json(bloqueio);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  try {
    const { id } = await req.json();
    const [bloqueio] = await getDb()
      .delete(bloqueios)
      .where(eq(bloqueios.id, String(id)))
      .returning();
    if (!bloqueio)
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    await recordAuditLog({
      admin: auth,
      acao: "BLOQUEIO_REMOVIDO",
      entidade: "Bloqueio",
      entidadeId: bloqueio.id,
      detalhes: { motivo: bloqueio.motivo, expira_em: bloqueio.expira_em },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
