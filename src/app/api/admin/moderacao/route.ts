import { NextRequest, NextResponse } from "next/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  lt,
  or,
} from "drizzle-orm";
import { getAdminIdentityWithRole, requireAdmin } from "@/lib/adminAuth";
import { recordAuditLog } from "@/lib/auditLog";
import { getDb } from "@/server/db/client";
import {
  atributos,
  avaliacoes,
  candidatos,
  manifestacoes,
  orgaosPublicos,
  servicosPublicos,
} from "@/server/db/schema";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const db = getDb();
    const ms = await db
      .select({
        m: manifestacoes,
        candidato: candidatos.nome,
        orgao: orgaosPublicos.nome,
        servico: servicosPublicos.nome,
      })
      .from(manifestacoes)
      .leftJoin(candidatos, eq(candidatos.id, manifestacoes.candidato_id))
      .leftJoin(orgaosPublicos, eq(orgaosPublicos.id, manifestacoes.orgao_id))
      .leftJoin(
        servicosPublicos,
        eq(servicosPublicos.id, manifestacoes.servico_id),
      )
      .orderBy(desc(manifestacoes.criado_em))
      .limit(50);

    const ids = ms.map((r) => r.m.id);
    const avs = ids.length
      ? await db
          .select({ av: avaliacoes, atributo: atributos.nome })
          .from(avaliacoes)
          .innerJoin(atributos, eq(atributos.id, avaliacoes.atributo_id))
          .where(inArray(avaliacoes.manifestacao_id, ids))
          .orderBy(asc(avaliacoes.criado_em))
      : [];

    const manifestacoesNormalizadas = ms.map(
      ({ m, candidato, orgao, servico }) => ({
        ...m,
        candidato: candidato ? { nome: candidato } : null,
        orgao: orgao ? { nome: orgao } : null,
        servico: servico ? { nome: servico } : null,
        avaliacoes: avs
          .filter((a) => a.av.manifestacao_id === m.id)
          .map((a) => ({ ...a.av, atributo: { nome: a.atributo } })),
        entidade: {
          nome: candidato ?? orgao ?? servico ?? "Desconhecido",
          tipo: candidato
            ? "politico"
            : orgao
              ? "orgao_publico"
              : servico
                ? "servico_publico"
                : "desconhecido",
        },
      }),
    );

    const [[total], [suspicious], [bots]] = await Promise.all([
      db.select({ n: count() }).from(manifestacoes),
      db
        .select({ n: count() })
        .from(manifestacoes)
        .where(
          or(
            and(
              isNotNull(manifestacoes.duration_ms),
              lt(manifestacoes.duration_ms, 8000),
            ),
            eq(manifestacoes.is_valid, false),
          ),
        ),
      db
        .select({ n: count() })
        .from(manifestacoes)
        .where(eq(manifestacoes.honeypot_triggered, true)),
    ]);

    return NextResponse.json({
      manifestacoes: manifestacoesNormalizadas,
      stats: { total: total.n, suspicious: suspicious.n, bots: bots.n },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar dados de moderação" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
  if ("error" in auth) return auth.error;

  try {
    const { id, is_valid } = await req.json();
    if (typeof id !== "string" || typeof is_valid !== "boolean") {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    const db = getDb();
    // Manifestação e suas avaliações mudam juntas, para refletir nos resultados.
    const [updated] = await db.batch([
      db
        .update(manifestacoes)
        .set({ is_valid })
        .where(eq(manifestacoes.id, id))
        .returning(),
      db
        .update(avaliacoes)
        .set({ is_valid })
        .where(eq(avaliacoes.manifestacao_id, id)),
    ]);
    const manifestacao = updated[0];
    if (!manifestacao)
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

    await recordAuditLog({
      admin: auth,
      acao: is_valid ? "MANIFESTACAO_VALIDADA" : "MANIFESTACAO_INVALIDADA",
      entidade: "Manifestacao",
      entidadeId: manifestacao.id,
      detalhes: {
        candidato_id: manifestacao.candidato_id,
        is_valid: manifestacao.is_valid,
      },
    });
    return NextResponse.json(manifestacao);
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar manifestação" },
      { status: 500 },
    );
  }
}
