import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, desc, eq, gte, like, lte, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/server/db/client";
import { auditLogs } from "@/server/db/schema";

function parseOptionalDate(value: string | null, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1") || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(sp.get("limit") || "50") || 50),
    );
    const acao = sp.get("acao") || "";
    const entidade = sp.get("entidade") || "";
    const search = (sp.get("search") || "").trim().replace(/[%_]/g, "");
    const inicio = parseOptionalDate(sp.get("inicio"));
    const fim = parseOptionalDate(sp.get("fim"), true);

    // LIKE do SQLite já ignora maiúsculas/minúsculas para ASCII
    const pattern = `%${search}%`;
    const where = and(
      acao ? eq(auditLogs.acao, acao) : undefined,
      entidade ? eq(auditLogs.entidade, entidade) : undefined,
      inicio ? gte(auditLogs.criado_em, inicio) : undefined,
      fim ? lte(auditLogs.criado_em, fim) : undefined,
      search
        ? or(
            like(auditLogs.acao, pattern),
            like(auditLogs.entidade, pattern),
            like(auditLogs.entidade_id, pattern),
            like(auditLogs.usuario_id, pattern),
          )
        : undefined,
    );

    const db = getDb();
    const [logs, [tot], acoes, entidades] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.criado_em))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ n: count() }).from(auditLogs).where(where),
      db
        .selectDistinct({ acao: auditLogs.acao })
        .from(auditLogs)
        .orderBy(asc(auditLogs.acao)),
      db
        .selectDistinct({ entidade: auditLogs.entidade })
        .from(auditLogs)
        .orderBy(asc(auditLogs.entidade)),
    ]);
    const total = tot?.n ?? 0;

    return NextResponse.json({
      data: logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      filters: {
        acoes: acoes.map((i) => i.acao),
        entidades: entidades.map((i) => i.entidade),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar AuditLog:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar auditoria" },
      { status: 500 },
    );
  }
}
