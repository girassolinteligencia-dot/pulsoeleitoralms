import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getAdminIdentity } from "@/lib/adminAuth";
import { recordAuditLog } from "@/lib/auditLog";
import { getDb } from "@/server/db/client";
import {
  atributos,
  avaliacoes,
  candidatos,
  orgaosPublicos,
  servicosPublicos,
} from "@/server/db/schema";
import { resolveRodadaScope } from "@/server/repos/rodadaScope";

// Evita injeção de fórmula ao abrir o CSV em planilhas (=, +, -, @ no início).
function escapeCsvValue(value: string | number | boolean | null | undefined) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

const MAX_LINHAS = 100_000;

export async function GET(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ("error" in auth) return auth.error;

  try {
    const sp = req.nextUrl.searchParams;
    const rodadaId = sp.get("rodadaId");
    const diasParam = sp.get("dias");
    const dias = diasParam ? parseInt(diasParam) : undefined;
    const scopedExport = Boolean(rodadaId || diasParam);
    const db = getDb();
    const scope = await resolveRodadaScope(db, { rodadaId, dias });

    if (rodadaId && !scope.rodada) {
      return NextResponse.json(
        { error: "Rodada metodológica não encontrada" },
        { status: 404 },
      );
    }

    const rows = await db
      .select({
        id: avaliacoes.id,
        valor: avaliacoes.valor,
        criado_em: avaliacoes.criado_em,
        atributo: atributos.nome,
        cNome: candidatos.nome,
        cCargo: candidatos.cargo,
        cPartido: candidatos.partido,
        oNome: orgaosPublicos.nome,
        oTipo: orgaosPublicos.tipo,
        sNome: servicosPublicos.nome,
        sTipo: servicosPublicos.tipo,
      })
      .from(avaliacoes)
      .innerJoin(atributos, eq(atributos.id, avaliacoes.atributo_id))
      .leftJoin(candidatos, eq(candidatos.id, avaliacoes.candidato_id))
      .leftJoin(orgaosPublicos, eq(orgaosPublicos.id, avaliacoes.orgao_id))
      .leftJoin(
        servicosPublicos,
        eq(servicosPublicos.id, avaliacoes.servico_id),
      )
      .where(scopedExport ? scope.avaliacaoWhere : undefined)
      .orderBy(desc(avaliacoes.criado_em))
      .limit(MAX_LINHAS);

    const headers = [
      "Rodada",
      "Tipo_Rodada",
      "Campanha",
      "Periodo_Inicio",
      "Periodo_Fim",
      "ID",
      "Tipo_Entidade",
      "Entidade",
      "Tipo_Label",
      "Candidato",
      "Cargo",
      "Partido",
      "Atributo",
      "Valor",
      "Data",
    ];
    const linhas = rows.map((a) => {
      const [tipoEntidade, entidade, tipoLabel] = a.cNome
        ? ["politico", a.cNome, a.cCargo ?? ""]
        : a.oNome
          ? ["orgao_publico", a.oNome, a.oTipo ?? ""]
          : a.sNome
            ? ["servico_publico", a.sNome, a.sTipo ?? ""]
            : ["", "", ""];
      return [
        scope.rodada?.titulo || "",
        scope.rodada?.tipo || "",
        scope.rodada?.campanha?.nome || entidade || "",
        scopedExport ? scope.startDate.toISOString() : "",
        scopedExport ? scope.endDate?.toISOString() || "" : "",
        a.id,
        tipoEntidade,
        entidade,
        tipoLabel,
        a.cNome ?? "",
        a.cCargo ?? "",
        a.cPartido ?? "",
        a.atributo,
        a.valor,
        a.criado_em.toISOString(),
      ];
    });

    const csvContent = [headers, ...linhas]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    await recordAuditLog({
      admin: auth,
      acao: "EXPORT_CSV_GERADO",
      entidade: scope.rodada ? "RodadaMetodologica" : "Avaliacao",
      entidadeId: scope.rodada?.id || "avaliacoes",
      detalhes: {
        rodada_id: scope.rodada?.id || null,
        dias: dias || null,
        total_linhas: linhas.length,
        escopo_filtrado: scopedExport,
      },
    });

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${scope.rodada ? `rodada_${scope.rodada.id}` : "avaliacoes"}_pulsoms_ia.csv`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
