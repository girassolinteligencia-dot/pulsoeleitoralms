import { NextRequest, NextResponse } from "next/server";
import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  gt,
  like,
  lt,
  max,
  or,
  type SQL,
} from "drizzle-orm";
import { getAdminIdentity, getAdminIdentityWithRole } from "@/lib/adminAuth";
import { recordAuditLog } from "@/lib/auditLog";
import { getDb } from "@/server/db/client";
import { cepsMs } from "@/server/db/schema";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function parsePositiveInt(
  value: string | null,
  fallback: number,
  maxV = Number.MAX_SAFE_INTEGER,
) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, maxV);
}
const normalizeText = (value: unknown, maxLength = 120) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const filtroStatus: Record<string, SQL> = {
  ambiguos: gt(cepsMs.localidades_count, 1),
  "baixa-confianca": lt(cepsMs.bairro_confianca, 0.8),
  revisados: like(cepsMs.origem, "%revisado%"),
};

export async function GET(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ("error" in auth) return auth.error;

  try {
    const sp = req.nextUrl.searchParams;
    const page = parsePositiveInt(sp.get("page"), 1);
    const limit = parsePositiveInt(sp.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);
    const search = normalizeText(sp.get("search") || "", 80).replace(
      /[%_]/g,
      "",
    );
    const status = sp.get("status") || "todos";

    const where = and(
      search
        ? or(
            like(cepsMs.cep, `%${search}%`),
            like(cepsMs.cidade, `%${search}%`),
            like(cepsMs.bairro, `%${search}%`),
          )
        : undefined,
      filtroStatus[status],
    );

    const db = getDb();
    const [data, [tot], [summary], [amb], [baixa], [rev]] = await Promise.all([
      db
        .select()
        .from(cepsMs)
        .where(where)
        .orderBy(
          asc(cepsMs.bairro_confianca),
          desc(cepsMs.localidades_count),
          asc(cepsMs.cep),
        )
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ n: count() }).from(cepsMs).where(where),
      db
        .select({
          total: count(),
          media: avg(cepsMs.bairro_confianca),
          importadoEm: max(cepsMs.importado_em),
        })
        .from(cepsMs),
      db.select({ n: count() }).from(cepsMs).where(filtroStatus.ambiguos),
      db
        .select({ n: count() })
        .from(cepsMs)
        .where(filtroStatus["baixa-confianca"]),
      db.select({ n: count() }).from(cepsMs).where(filtroStatus.revisados),
    ]);
    const total = tot?.n ?? 0;

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: {
        total: summary.total,
        ambiguos: amb.n,
        baixaConfianca: baixa.n,
        revisados: rev.n,
        confiancaMedia: Number(summary.media) || 0,
        importadoEm: summary.importadoEm,
      },
    });
  } catch (error) {
    console.error("Erro ao listar CEPs MS:", error);
    return NextResponse.json(
      { error: "Erro ao listar CEPs." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const cep = normalizeText(body.cep, 8).replace(/\D/g, "");
    const bairro = normalizeText(body.bairro, 120);
    if (!/^\d{8}$/.test(cep) || !bairro) {
      return NextResponse.json(
        { error: "CEP e bairro são obrigatórios." },
        { status: 400 },
      );
    }

    const db = getDb();
    const [current] = await db
      .select()
      .from(cepsMs)
      .where(eq(cepsMs.cep, cep))
      .limit(1);
    if (!current)
      return NextResponse.json(
        { error: "CEP não encontrado." },
        { status: 404 },
      );

    const [updated] = await db
      .update(cepsMs)
      .set({
        bairro,
        bairro_confianca: 1,
        origem: current.origem.includes("revisado")
          ? current.origem
          : `${current.origem}_revisado`,
        atualizado_em: new Date(),
      })
      .where(eq(cepsMs.cep, cep))
      .returning();

    await recordAuditLog({
      admin: auth,
      acao: "CEP_MS_REVISADO",
      entidade: "CepMs",
      entidadeId: cep,
      detalhes: {
        cep,
        cidade: updated.cidade,
        bairro_anterior: current.bairro,
        bairro_revisado: updated.bairro,
        origem_anterior: current.origem,
        origem_atual: updated.origem,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao revisar CEP MS:", error);
    return NextResponse.json(
      { error: "Erro ao revisar CEP." },
      { status: 500 },
    );
  }
}
