import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getAdminIdentityWithRole } from "@/lib/adminAuth";
import { recordAuditLog } from "@/lib/auditLog";
import { getDb } from "@/server/db/client";
import { parametrosPlataforma } from "@/server/db/schema";
import {
  detectarFormato,
  gravarImagem,
  removerImagem,
} from "@/server/admin/fotoRoute";

// Imagens de identidade visual. A conversão para WebP agora é feita no navegador
// (sharp não roda no Workers); aqui só validamos o formato real e gravamos no R2.
const MAX_SIZE = 512 * 1024;
const CHAVES_PERMITIDAS = [
  "geral_favicon_url",
  "geral_pwa_icone_url",
  "geral_og_imagem_url",
  "geral_patrocinio_imagem_url",
] as const;
type ChavePermitida = (typeof CHAVES_PERMITIDAS)[number];

const DESCRICOES: Record<ChavePermitida, string> = {
  geral_favicon_url: "URL do favicon do site.",
  geral_pwa_icone_url: "Ícone exibido ao instalar o site como app.",
  geral_og_imagem_url: "URL da imagem Open Graph personalizada.",
  geral_patrocinio_imagem_url:
    "Logo do patrocinador exibida nos banners da plataforma.",
};

export async function POST(req: NextRequest) {
  const auth = await getAdminIdentityWithRole(req, ["admin"]);
  if ("error" in auth) return auth.error;

  try {
    const form = await req.formData();
    const file = form.get("file");
    const chave = form.get("chave");
    if (!(file instanceof File))
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 },
      );
    if (
      typeof chave !== "string" ||
      !CHAVES_PERMITIDAS.includes(chave as ChavePermitida)
    ) {
      return NextResponse.json({ error: "Chave inválida." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error: `Arquivo muito grande (${(file.size / 1024).toFixed(0)} KB). Máximo: 512 KB.`,
        },
        { status: 422 },
      );
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const formato = detectarFormato(bytes);
    if (!formato) {
      return NextResponse.json(
        { error: "Formato não suportado. Use .webp, .png, .jpg ou .ico" },
        { status: 422 },
      );
    }

    const key = await gravarImagem(`site/${chave}`, bytes, formato);
    const url = `/fotos/${key}`;

    const db = getDb();
    const [anterior] = await db
      .select({ valor: parametrosPlataforma.valor })
      .from(parametrosPlataforma)
      .where(eq(parametrosPlataforma.chave, chave))
      .limit(1);

    await db
      .insert(parametrosPlataforma)
      .values({
        chave,
        valor: url,
        grupo: "geral",
        descricao: DESCRICOES[chave as ChavePermitida],
      })
      .onConflictDoUpdate({
        target: parametrosPlataforma.chave,
        set: { valor: url, updatedAt: new Date() },
      });

    const antiga = typeof anterior?.valor === "string" ? anterior.valor : "";
    if (antiga.startsWith("/fotos/site/"))
      await removerImagem(antiga.slice("/fotos/".length));

    await recordAuditLog({
      admin: auth,
      acao: "IDENTIDADE_ATUALIZADA",
      entidade: "ParametroPlataforma",
      entidadeId: chave,
      detalhes: { url },
    });
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Erro no upload de identidade:", error);
    return NextResponse.json(
      { error: "Erro interno no upload." },
      { status: 500 },
    );
  }
}
