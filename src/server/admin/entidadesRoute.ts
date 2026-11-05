import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { asc, count, eq, like } from "drizzle-orm";
import { getAdminIdentityWithRole, requireAdmin } from "@/lib/adminAuth";
import { recordAuditLog } from "@/lib/auditLog";
import { getFotoUrl } from "@/lib/fotoUrl";
import { buildBusca, likePattern } from "@/lib/normalize-search";
import { getDb } from "@/server/db/client";
import {
  campanhas,
  orgaosPublicos,
  servicosPublicos,
} from "@/server/db/schema";

type Tipo = "orgao" | "servico";
const cfg = {
  orgao: {
    t: orgaosPublicos,
    entidade: "OrgaoPublico",
    prefixo: "ORGAO",
    nome: "órgão",
  },
  servico: {
    t: servicosPublicos,
    entidade: "ServicoPublico",
    prefixo: "SERVICO",
    nome: "serviço",
  },
} as const;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Handlers CRUD do admin para órgãos ou serviços públicos (mesmo contrato da API legada). */
export function entidadesAdminRoute(tipo: Tipo) {
  const { t, entidade, prefixo, nome } = cfg[tipo];

  async function GET(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1") || 1);
    const limit = Math.min(
      200,
      Math.max(1, parseInt(sp.get("limit") || "50") || 50),
    );
    const search = (sp.get("search") || "").trim();
    try {
      const db = getDb();
      const where = search ? like(t.busca, likePattern(search)) : undefined;
      const [rows, [tot]] = await Promise.all([
        db
          .select({
            e: t,
            campanha: { id: campanhas.id, nome: campanhas.nome },
          })
          .from(t)
          .leftJoin(campanhas, eq(campanhas.id, t.campanha_id))
          .where(where)
          .orderBy(asc(t.cidade), asc(t.nome))
          .limit(limit)
          .offset((page - 1) * limit),
        db.select({ n: count() }).from(t).where(where),
      ]);
      const total = tot?.n ?? 0;
      return NextResponse.json({
        data: rows.map(({ e, campanha }) => ({
          ...e,
          campanha: campanha?.id ? campanha : null,
          foto_url: getFotoUrl(e.foto_url),
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error(`Erro ao buscar ${nome}s admin:`, error);
      return NextResponse.json(
        { data: [], total: 0, page: 1, totalPages: 0 },
        { status: 200 },
      );
    }
  }

  async function POST(req: NextRequest) {
    const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
    if ("error" in auth) return auth.error;
    try {
      const b = await req.json();
      const values = {
        nome: str(b.nome),
        tipo: str(b.tipo),
        cidade: str(b.cidade),
        uf: (str(b.uf) || "MS").toUpperCase().slice(0, 2),
        descricao: str(b.descricao) || null,
        foto_url: str(b.foto_url) || null,
        campanha_id: b.campanha_id || null,
      };
      if (!values.nome || !values.tipo || !values.cidade) {
        return NextResponse.json(
          { error: "Campos obrigatórios: nome, tipo, cidade" },
          { status: 400 },
        );
      }
      const [row] = await getDb()
        .insert(t)
        .values({
          ...values,
          busca: buildBusca(values.nome, values.tipo, values.cidade),
        })
        .returning();
      await recordAuditLog({
        admin: auth,
        acao: `${prefixo}_CRIADO`,
        entidade,
        entidadeId: row.id,
        detalhes: { nome: row.nome, tipo: row.tipo, cidade: row.cidade },
      });
      return NextResponse.json(row, { status: 201 });
    } catch (error) {
      console.error(`Erro ao criar ${nome}:`, error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  }

  async function PATCH(req: NextRequest) {
    const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
    if ("error" in auth) return auth.error;
    try {
      const b = await req.json();
      if (!b.id)
        return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
      const db = getDb();
      const [atual] = await db
        .select()
        .from(t)
        .where(eq(t.id, String(b.id)))
        .limit(1);
      if (!atual)
        return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

      const set: Partial<typeof t.$inferInsert> = {};
      if (b.nome !== undefined) set.nome = str(b.nome);
      if (b.tipo !== undefined) set.tipo = str(b.tipo);
      if (b.cidade !== undefined) set.cidade = str(b.cidade);
      if (b.uf !== undefined) set.uf = str(b.uf).toUpperCase().slice(0, 2);
      if (b.descricao !== undefined) set.descricao = str(b.descricao) || null;
      if (b.foto_url !== undefined) set.foto_url = str(b.foto_url) || null;
      if (b.campanha_id !== undefined) set.campanha_id = b.campanha_id || null;
      if (b.status !== undefined) set.status = String(b.status);
      set.busca = buildBusca(
        set.nome ?? atual.nome,
        set.tipo ?? atual.tipo,
        set.cidade ?? atual.cidade,
      );

      const [row] = await db
        .update(t)
        .set(set)
        .where(eq(t.id, atual.id))
        .returning();
      await recordAuditLog({
        admin: auth,
        acao: `${prefixo}_ATUALIZADO`,
        entidade,
        entidadeId: row.id,
        detalhes: { nome: row.nome, tipo: row.tipo, cidade: row.cidade },
      });
      return NextResponse.json(row);
    } catch (error) {
      console.error(`Erro ao atualizar ${nome}:`, error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  }

  async function DELETE(req: NextRequest) {
    const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
    if ("error" in auth) return auth.error;
    const id = req.nextUrl.searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    try {
      const [row] = await getDb().delete(t).where(eq(t.id, id)).returning();
      if (!row)
        return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
      await recordAuditLog({
        admin: auth,
        acao: `${prefixo}_REMOVIDO`,
        entidade,
        entidadeId: row.id,
        detalhes: { nome: row.nome },
      });
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error(`Erro ao remover ${nome}:`, error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  }

  return { GET, POST, PATCH, DELETE };
}
