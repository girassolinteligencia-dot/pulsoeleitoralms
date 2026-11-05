import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getAdminIdentityWithRole, requireAdmin } from "@/lib/adminAuth";
import { recordAuditLog } from "@/lib/auditLog";
import { getDb } from "@/server/db/client";
import { parametrosPlataforma } from "@/server/db/schema";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  try {
    return NextResponse.json(
      await getDb()
        .select()
        .from(parametrosPlataforma)
        .orderBy(asc(parametrosPlataforma.grupo)),
    );
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar parâmetros" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin"]);
  if ("error" in auth) return auth.error;

  try {
    const { chave, valor, grupo, descricao } = await req.json();
    if (typeof chave !== "string" || !chave || valor === undefined) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    const set = {
      valor,
      grupo: grupo ?? "geral",
      descricao: descricao ?? null,
      updatedAt: new Date(),
    };
    const [parametro] = await getDb()
      .insert(parametrosPlataforma)
      .values({ chave, ...set })
      .onConflictDoUpdate({ target: parametrosPlataforma.chave, set })
      .returning();

    await recordAuditLog({
      admin: auth,
      acao: "PARAMETRO_SALVO",
      entidade: "ParametroPlataforma",
      entidadeId: parametro.id,
      detalhes: {
        chave: parametro.chave,
        grupo: parametro.grupo,
        descricao: parametro.descricao,
      },
    });
    return NextResponse.json(parametro);
  } catch {
    return NextResponse.json(
      { error: "Erro ao salvar parâmetro" },
      { status: 500 },
    );
  }
}
