import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, eq, like, sql } from "drizzle-orm";
import { getAdminIdentityWithRole, requireAdmin } from "@/lib/adminAuth";
import { recordAuditLog } from "@/lib/auditLog";
import { buildBusca, likePattern } from "@/lib/normalize-search";
import { getDb } from "@/server/db/client";
import { campanhas, candidatos } from "@/server/db/schema";
import {
  getPublicScopeConfig,
  publicCandidateConditions,
} from "@/server/repos/scope";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// GET: candidatos do escopo público, paginados
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1") || 1);
    const limit = Math.min(
      200,
      Math.max(1, parseInt(sp.get("limit") || "50") || 50),
    );
    const search = (sp.get("search") || "").trim();

    const db = getDb();
    const scope = await getPublicScopeConfig(db);
    const where = publicCandidateConditions(
      scope,
      search ? like(candidatos.busca, likePattern(search)) : undefined,
    );

    const [rows, [tot]] = await Promise.all([
      db
        .select({ c: candidatos, campanha: campanhas })
        .from(candidatos)
        .innerJoin(campanhas, eq(campanhas.id, candidatos.campanha_id))
        .where(where)
        .orderBy(asc(candidatos.nome))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ n: count() })
        .from(candidatos)
        .innerJoin(campanhas, eq(campanhas.id, candidatos.campanha_id))
        .where(where),
    ]);
    const total = tot?.n ?? 0;

    return NextResponse.json({
      data: rows.map(({ c, campanha }) => ({ ...c, campanha })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Erro ao buscar candidatos admin:", error);
    return NextResponse.json(
      { data: [], total: 0, page: 1, totalPages: 0 },
      { status: 200 },
    );
  }
}

// POST: cria candidato (com verificação de duplicidade)
export async function POST(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
  if ("error" in auth) return auth.error;

  try {
    const b = await req.json();
    const nome = str(b.nome).toUpperCase();
    const cargo = str(b.cargo);
    const cidade = str(b.cidade);
    if (!nome || !cargo || !cidade || !b.campanha_id) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, cargo, cidade, campanha_id" },
        { status: 400 },
      );
    }

    const db = getDb();
    // Duplicidade: mesmo nome + cargo + cidade (ignorando maiúsculas) em qualquer campanha
    const existing = await db
      .select({ c: candidatos, campanha: campanhas.nome })
      .from(candidatos)
      .innerJoin(campanhas, eq(campanhas.id, candidatos.campanha_id))
      .where(
        and(
          sql`upper(${candidatos.nome}) = ${nome}`,
          sql`lower(${candidatos.cargo}) = lower(${cargo})`,
          sql`lower(${candidatos.cidade}) = lower(${cidade})`,
        ),
      )
      .limit(5);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error: "duplicado",
          message: "Político já cadastrado na plataforma.",
          existentes: existing.map(({ c, campanha }) => ({
            id: c.id,
            nome: c.nome,
            cargo: c.cargo,
            cidade: c.cidade,
            partido: c.partido,
            ano_eleicao: c.ano_eleicao,
            campanha,
          })),
        },
        { status: 409 },
      );
    }

    if (b.check_only)
      return NextResponse.json({
        ok: true,
        message: "Nenhum duplicado encontrado.",
      });

    const partido = str(b.partido) || null;
    const [candidato] = await db
      .insert(candidatos)
      .values({
        nome,
        partido,
        numero: str(b.numero) || null,
        cargo,
        cidade,
        bairro: str(b.bairro) || null,
        foto_url: str(b.foto_url) || null,
        campanha_id: String(b.campanha_id),
        ano_eleicao: b.ano_eleicao ? parseInt(b.ano_eleicao) : 2026,
        busca: buildBusca(nome, cargo, partido, cidade),
      })
      .returning();

    await recordAuditLog({
      admin: auth,
      acao: "CANDIDATO_CRIADO",
      entidade: "Candidato",
      entidadeId: candidato.id,
      detalhes: {
        nome: candidato.nome,
        cargo: candidato.cargo,
        cidade: candidato.cidade,
        campanha_id: candidato.campanha_id,
      },
    });
    return NextResponse.json(candidato, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PATCH: atualiza candidato
export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
  if ("error" in auth) return auth.error;

  try {
    const b = await req.json();
    if (!b.id)
      return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    const db = getDb();
    const [atual] = await db
      .select()
      .from(candidatos)
      .where(eq(candidatos.id, String(b.id)))
      .limit(1);
    if (!atual)
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const set: Partial<typeof candidatos.$inferInsert> = {};
    if (b.nome !== undefined) set.nome = str(b.nome);
    if (b.partido !== undefined) set.partido = b.partido;
    if (b.numero !== undefined) set.numero = b.numero;
    if (b.cargo !== undefined) set.cargo = str(b.cargo);
    if (b.cidade !== undefined) set.cidade = str(b.cidade);
    if (b.foto_url !== undefined) set.foto_url = b.foto_url;
    if (b.status_verificacao !== undefined)
      set.status_verificacao = Boolean(b.status_verificacao);
    set.busca = buildBusca(
      set.nome ?? atual.nome,
      atual.nome_urna,
      set.cargo ?? atual.cargo,
      set.partido ?? atual.partido,
      set.cidade ?? atual.cidade,
    );

    const [candidato] = await db
      .update(candidatos)
      .set(set)
      .where(eq(candidatos.id, atual.id))
      .returning();
    await recordAuditLog({
      admin: auth,
      acao: "CANDIDATO_ATUALIZADO",
      entidade: "Candidato",
      entidadeId: candidato.id,
      detalhes: {
        nome: candidato.nome,
        cargo: candidato.cargo,
        cidade: candidato.cidade,
      },
    });
    return NextResponse.json(candidato);
  } catch (error) {
    console.error("Erro ao atualizar candidato:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
