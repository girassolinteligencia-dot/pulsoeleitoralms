import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/server/db/client";

export const dynamic = "force-dynamic";

// Campo Grande (MS) é UTC-4 o ano todo (sem horário de verão desde 2019).
const OFFSET_MS = "-4 hours";

function formatCampoGrandeDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Campo_Grande",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

type Top = {
  id: string;
  nome: string | null;
  sub: string | null;
  cidade: string | null;
  total: number;
  soma: number;
};

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const db = getDb();
    const agora = Date.now();
    const inicio24h = agora - 24 * 60 * 60 * 1000;
    const inicio7d = agora - 7 * 24 * 60 * 60 * 1000;

    const top = (col: string, tabela: string, sub: string) =>
      db.all<Top>(sql`
        select a.${sql.raw(col)} as id, e.nome as nome, e.${sql.raw(sub)} as sub, e.cidade as cidade,
               count(*) as total, coalesce(sum(a.valor), 0) as soma
        from avaliacoes a left join ${sql.raw(tabela)} e on e.id = a.${sql.raw(col)}
        where a.${sql.raw(col)} is not null
        group by a.${sql.raw(col)}
        order by total desc
        limit 5
      `);

    const [[tot], topCand, topOrg, topSvc, topAtrib, semana] =
      await Promise.all([
        db.all<Record<string, number>>(sql`
        select
          (select count(*) from manifestacoes) as totalEvaluations,
          (select count(*) from candidatos where status = 'Ativo') as totalCandidatos,
          (select count(*) from campanhas) as totalCampanhas,
          (select count(*) from atributos where visivel = 1) as totalAtributos,
          (select count(*) from orgaos_publicos where status = 'Ativo') as totalOrgaos,
          (select count(*) from servicos_publicos where status = 'Ativo') as totalServicos,
          (select count(*) from manifestacoes where criado_em >= ${inicio24h}) as avaliacoes24h,
          (select count(*) from bloqueios where expira_em is null or expira_em > ${agora}) as bloqueiosAtivos
      `),
        top("candidato_id", "candidatos", "cargo"),
        top("orgao_id", "orgaos_publicos", "tipo"),
        top("servico_id", "servicos_publicos", "tipo"),
        db.all<{
          id: string;
          nome: string | null;
          polaridade: number | null;
          total: number;
        }>(sql`
        select a.atributo_id as id, t.nome as nome, t.polaridade as polaridade, count(*) as total
        from avaliacoes a left join atributos t on t.id = a.atributo_id
        group by a.atributo_id order by total desc limit 5
      `),
        db.all<{ dia: string; total: number }>(sql`
        select date(criado_em / 1000, 'unixepoch', ${OFFSET_MS}) as dia, count(*) as total
        from manifestacoes where criado_em >= ${inicio7d}
        group by dia order by dia asc
      `),
      ]);

    const mapTop = (rows: Top[], subKey: "cargo" | "tipo") =>
      rows.map((r) => ({
        id: r.id,
        nome: r.nome ?? "—",
        [subKey]: r.sub ?? "—",
        cidade: r.cidade ?? "—",
        total: r.total,
        liquidScore: r.soma ?? 0,
      }));

    const atividadeSemanal: { dia: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const diaStr = formatCampoGrandeDate(
        new Date(agora - i * 24 * 60 * 60 * 1000),
      );
      atividadeSemanal.push({
        dia: diaStr,
        total: Number(semana.find((r) => r.dia === diaStr)?.total ?? 0),
      });
    }

    return NextResponse.json({
      ...tot,
      topCandidatos: mapTop(topCand, "cargo"),
      topOrgaos: mapTop(topOrg, "tipo"),
      topServicos: mapTop(topSvc, "tipo"),
      topAtributos: topAtrib.map((r) => ({
        id: r.id,
        nome: r.nome ?? "—",
        polaridade: r.polaridade ?? 1,
        total: r.total,
      })),
      atividadeSemanal,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
