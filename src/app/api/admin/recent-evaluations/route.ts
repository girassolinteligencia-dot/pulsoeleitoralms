import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/server/db/client";
import {
  atributos,
  avaliacoes,
  candidatos,
  orgaosPublicos,
  servicosPublicos,
} from "@/server/db/schema";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const rows = await getDb()
      .select({
        av: avaliacoes,
        candidato: candidatos.nome,
        orgao: orgaosPublicos.nome,
        servico: servicosPublicos.nome,
        atributo: atributos.nome,
      })
      .from(avaliacoes)
      .leftJoin(candidatos, eq(candidatos.id, avaliacoes.candidato_id))
      .leftJoin(orgaosPublicos, eq(orgaosPublicos.id, avaliacoes.orgao_id))
      .leftJoin(
        servicosPublicos,
        eq(servicosPublicos.id, avaliacoes.servico_id),
      )
      .innerJoin(atributos, eq(atributos.id, avaliacoes.atributo_id))
      .orderBy(desc(avaliacoes.criado_em))
      .limit(10);

    return NextResponse.json(
      rows.map((r) => ({
        ...r.av,
        candidato: r.candidato ? { nome: r.candidato } : null,
        orgao: r.orgao ? { nome: r.orgao } : null,
        servico: r.servico ? { nome: r.servico } : null,
        atributo: { nome: r.atributo },
      })),
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
