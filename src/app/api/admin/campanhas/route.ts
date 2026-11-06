import { NextRequest, NextResponse } from "next/server";
import { count, desc, eq, inArray, like, sql } from "drizzle-orm";
import { getAdminIdentityWithRole, requireAdmin } from "@/lib/adminAuth";
import { recordAuditLog } from "@/lib/auditLog";
import { getDb, type DB } from "@/server/db/client";
import {
  avaliacoes,
  campanhaAtributos,
  campanhas,
  candidatos,
  manifestacoes,
  orgaosPublicos,
  rodadasMetodologicas,
  servicosPublicos,
} from "@/server/db/schema";
import {
  getPublicScopeConfig,
  publicCandidateConditions,
} from "@/server/repos/scope";

/** Contagens de vínculos por campanha (equivalente ao _count do Prisma). */
async function contagens(db: DB, id: string) {
  const [r] = await db.all<{
    candidatos: number;
    atributos: number;
    orgaos: number;
    servicos: number;
    rodadas: number;
  }>(sql`
    select
      (select count(*) from candidatos where campanha_id = ${id}) as candidatos,
      (select count(*) from campanha_atributos where campanha_id = ${id}) as atributos,
      (select count(*) from orgaos_publicos where campanha_id = ${id}) as orgaos,
      (select count(*) from servicos_publicos where campanha_id = ${id}) as servicos,
      (select count(*) from rodadas_metodologicas where campanha_id = ${id}) as rodadas
  `);
  return r;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1") || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(sp.get("limit") || "20") || 20),
    );
    const search = (sp.get("search") || "").trim().replace(/[%_]/g, "");
    const where = search ? like(campanhas.nome, `%${search}%`) : undefined;

    const db = getDb();
    const scope = await getPublicScopeConfig(db);
    const [rows, [tot]] = await Promise.all([
      db
        .select()
        .from(campanhas)
        .where(where)
        .orderBy(desc(campanhas.data_inicio))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ n: count() }).from(campanhas).where(where),
    ]);

    const data = await Promise.all(
      rows.map(async (campanha) => {
        const [_count, [pub]] = await Promise.all([
          contagens(db, campanha.id),
          db
            .select({ n: count() })
            .from(candidatos)
            .innerJoin(campanhas, eq(campanhas.id, candidatos.campanha_id))
            .where(
              publicCandidateConditions(
                scope,
                eq(candidatos.campanha_id, campanha.id),
              ),
            ),
        ]);
        const selecionada =
          scope.mode === "all_active" ||
          scope.campanhasAtivas.includes(campanha.id);
        return {
          ...campanha,
          _count,
          public_scope: {
            visivel: campanha.status === "ativo" && selecionada && pub.n > 0,
            candidatos_visiveis: pub.n,
            modo: scope.mode,
            anos_ativos: scope.anosAtivos,
            selecionada,
          },
        };
      }),
    );

    const total = tot?.n ?? 0;
    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Erro ao buscar campanhas admin:", error);
    return NextResponse.json(
      { data: [], total: 0, page: 1, totalPages: 0 },
      { status: 200 },
    );
  }
}

const STATUS = ["ativo", "pausado", "encerrado"];

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
  if ("error" in auth) return auth.error;

  try {
    const { nome, slug, status, data_fim, meta_config } = await req.json();
    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      typeof slug !== "string" ||
      !slug.trim()
    ) {
      return NextResponse.json(
        { error: "Nome e slug são obrigatórios" },
        { status: 400 },
      );
    }
    const [campanha] = await getDb()
      .insert(campanhas)
      .values({
        nome: nome.trim(),
        slug: slug.trim(),
        status: STATUS.includes(status) ? status : "ativo",
        data_fim: data_fim ? new Date(data_fim) : null,
        meta_config:
          meta_config && typeof meta_config === "object" ? meta_config : null,
      })
      .returning();
    await recordAuditLog({
      admin: auth,
      acao: "CAMPANHA_CRIADA",
      entidade: "Campanha",
      entidadeId: campanha.id,
      detalhes: {
        nome: campanha.nome,
        slug: campanha.slug,
        status: campanha.status,
      },
    });
    return NextResponse.json(campanha);
  } catch (error) {
    console.error("Erro ao criar campanha:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar campanha" },
      { status: 500 },
    );
  }
}

// DELETE — restrito a admin, só ciclos encerrados e com confirmação digitada.
export async function DELETE(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin"]);
  if ("error" in auth) return auth.error;

  try {
    const { id, confirmConsequences, confirmationText } = await req.json();
    if (typeof id !== "string" || !id)
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

    const db = getDb();
    const [campanha] = await db
      .select()
      .from(campanhas)
      .where(eq(campanhas.id, id))
      .limit(1);
    if (!campanha)
      return NextResponse.json(
        { error: "Ciclo não encontrado" },
        { status: 404 },
      );

    if (campanha.status !== "encerrado") {
      return NextResponse.json(
        {
          error:
            "Apenas ciclos encerrados podem ser excluídos. Encerre o ciclo antes da exclusão.",
        },
        { status: 409 },
      );
    }
    if (confirmConsequences !== true || confirmationText !== campanha.nome) {
      return NextResponse.json(
        {
          error:
            "Confirme as consequências digitando exatamente o nome do ciclo.",
        },
        { status: 400 },
      );
    }

    const _count = await contagens(db, id);
    // Subconsulta em vez de lista de IDs (o D1 limita parâmetros por consulta).
    const candidatosDoCiclo = db
      .select({ id: candidatos.id })
      .from(candidatos)
      .where(eq(candidatos.campanha_id, id));
    const [[av], [man]] = await Promise.all([
      db
        .select({ n: count() })
        .from(avaliacoes)
        .where(inArray(avaliacoes.candidato_id, candidatosDoCiclo)),
      db
        .select({ n: count() })
        .from(manifestacoes)
        .where(inArray(manifestacoes.candidato_id, candidatosDoCiclo)),
    ]);

    await db.batch([
      db
        .delete(avaliacoes)
        .where(inArray(avaliacoes.candidato_id, candidatosDoCiclo)),
      db
        .delete(manifestacoes)
        .where(inArray(manifestacoes.candidato_id, candidatosDoCiclo)),
      db.delete(candidatos).where(eq(candidatos.campanha_id, id)),
      db.delete(campanhaAtributos).where(eq(campanhaAtributos.campanha_id, id)),
      db
        .update(orgaosPublicos)
        .set({ campanha_id: null })
        .where(eq(orgaosPublicos.campanha_id, id)),
      db
        .update(servicosPublicos)
        .set({ campanha_id: null })
        .where(eq(servicosPublicos.campanha_id, id)),
      db
        .update(rodadasMetodologicas)
        .set({ campanha_id: null })
        .where(eq(rodadasMetodologicas.campanha_id, id)),
      db.delete(campanhas).where(eq(campanhas.id, id)),
    ]);

    await recordAuditLog({
      admin: auth,
      acao: "CAMPANHA_EXCLUIDA",
      entidade: "Campanha",
      entidadeId: id,
      detalhes: {
        nome: campanha.nome,
        slug: campanha.slug,
        total_votos: campanha.total_votos,
        politicos_excluidos: _count.candidatos,
        atributos_removidos: _count.atributos,
        manifestacoes_politicos_excluidas: man.n,
        avaliacoes_politicos_excluidas: av.n,
        orgaos_desvinculados: _count.orgaos,
        servicos_desvinculados: _count.servicos,
        rodadas_desvinculadas: _count.rodadas,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir campanha:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir campanha" },
      { status: 500 },
    );
  }
}

// PATCH — somente campos editáveis (evita sobrescrever contadores como total_votos).
export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
  if ("error" in auth) return auth.error;

  try {
    const { id, nome, slug, status, data_fim, meta_config } = await req.json();
    if (typeof id !== "string" || !id)
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

    const set: Partial<typeof campanhas.$inferInsert> = {};
    if (typeof nome === "string" && nome.trim()) set.nome = nome.trim();
    if (typeof slug === "string" && slug.trim()) set.slug = slug.trim();
    if (STATUS.includes(status)) set.status = status;
    if (data_fim !== undefined)
      set.data_fim = data_fim ? new Date(data_fim) : null;
    if (meta_config !== undefined)
      set.meta_config =
        meta_config && typeof meta_config === "object" ? meta_config : null;
    if (Object.keys(set).length === 0)
      return NextResponse.json({ error: "Nada a atualizar" }, { status: 400 });

    const [campanha] = await getDb()
      .update(campanhas)
      .set(set)
      .where(eq(campanhas.id, id))
      .returning();
    if (!campanha)
      return NextResponse.json(
        { error: "Ciclo não encontrado" },
        { status: 404 },
      );
    await recordAuditLog({
      admin: auth,
      acao: "CAMPANHA_ATUALIZADA",
      entidade: "Campanha",
      entidadeId: campanha.id,
      detalhes: {
        nome: campanha.nome,
        slug: campanha.slug,
        status: campanha.status,
        campos: Object.keys(set),
      },
    });
    return NextResponse.json(campanha);
  } catch (error) {
    console.error("Erro ao atualizar campanha:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar campanha" },
      { status: 500 },
    );
  }
}
