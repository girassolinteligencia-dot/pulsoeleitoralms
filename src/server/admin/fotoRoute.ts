import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getAdminIdentityWithRole } from "@/lib/adminAuth";
import { recordAuditLog } from "@/lib/auditLog";
import { bindings } from "@/server/cf";
import { getDb } from "@/server/db/client";
import {
  candidatos,
  orgaosPublicos,
  servicosPublicos,
} from "@/server/db/schema";

export type Formato = "webp" | "png" | "jpg" | "ico";
export const CONTENT_TYPE: Record<Formato, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  ico: "image/x-icon",
};

/** Detecta o formato pelos bytes iniciais (o content-type do navegador não é confiável). */
export function detectarFormato(b: Uint8Array): Formato | null {
  const ascii = (s: number, e: number) => String.fromCharCode(...b.slice(s, e));
  if (b.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP")
    return "webp";
  if (b.length > 8 && b[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return "jpg";
  if (b.length > 4 && b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0)
    return "ico";
  return null;
}

/** Grava no R2 com chave versionada (cache imutável) e devolve a chave. */
export async function gravarImagem(
  prefixo: string,
  bytes: Uint8Array,
  formato: Formato,
) {
  const key = `${prefixo}-${Date.now().toString(36)}.${formato}`;
  await bindings().FOTOS.put(key, bytes, {
    httpMetadata: { contentType: CONTENT_TYPE[formato] },
  });
  return key;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Remove do R2 somente um objeto gerado pelo upload deste registro:
 * `<prefixo>-<versão>.<ext>` (ex.: "orgaos/<id>-lx3k2.webp"). Qualquer outra chave
 * (legado, outra entidade, identidade visual) é ignorada.
 */
export async function removerImagem(
  key: string | null | undefined,
  prefixo: string,
) {
  if (!key) return;
  const gerenciada = new RegExp(
    `^${escapeRe(prefixo)}-[0-9a-z]+\\.(webp|png|jpg|ico)$`,
  );
  if (!gerenciada.test(key)) return;
  try {
    await bindings().FOTOS.delete(key);
  } catch (e) {
    console.error("Falha ao remover objeto do R2:", key, e);
  }
}

const cfg = {
  candidato: {
    t: candidatos,
    campo: "candidatoId",
    pasta: "candidatos/manual",
    entidade: "Candidato",
  },
  orgao: {
    t: orgaosPublicos,
    campo: "orgaoId",
    pasta: "orgaos",
    entidade: "OrgaoPublico",
  },
  servico: {
    t: servicosPublicos,
    campo: "servicoId",
    pasta: "servicos",
    entidade: "ServicoPublico",
  },
} as const;

const MAX_SIZE = 300 * 1024;

/** Upload/remoção de foto (WebP até 300 KB) de candidato, órgão ou serviço. */
export function fotoAdminRoute(tipo: keyof typeof cfg) {
  const { t, campo, pasta, entidade } = cfg[tipo];

  async function POST(req: NextRequest) {
    const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
    if ("error" in auth) return auth.error;
    try {
      const form = await req.formData();
      const file = form.get("foto");
      const id = form.get(campo);
      if (!(file instanceof File))
        return NextResponse.json(
          { error: "Nenhum arquivo enviado." },
          { status: 400 },
        );
      if (typeof id !== "string" || !id)
        return NextResponse.json(
          { error: `${campo} obrigatório.` },
          { status: 400 },
        );
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          {
            error: `Arquivo muito grande (${(file.size / 1024).toFixed(0)} KB). Máximo: 300 KB.`,
          },
          { status: 422 },
        );
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (detectarFormato(bytes) !== "webp") {
        return NextResponse.json(
          { error: "Formato inválido. Apenas .webp é aceito." },
          { status: 422 },
        );
      }

      const db = getDb();
      const [atual] = await db
        .select({ foto_url: t.foto_url })
        .from(t)
        .where(eq(t.id, id))
        .limit(1);
      if (!atual)
        return NextResponse.json(
          { error: "Registro não encontrado." },
          { status: 404 },
        );

      const foto_url = await gravarImagem(`${pasta}/${id}`, bytes, "webp");
      await db.update(t).set({ foto_url }).where(eq(t.id, id));
      await removerImagem(atual.foto_url, `${pasta}/${id}`);
      await recordAuditLog({
        admin: auth,
        acao: "FOTO_ATUALIZADA",
        entidade,
        entidadeId: id,
        detalhes: { foto_url },
      });
      return NextResponse.json({ foto_url });
    } catch (error) {
      console.error("Erro no upload de foto:", error);
      return NextResponse.json(
        { error: "Erro interno no upload." },
        { status: 500 },
      );
    }
  }

  async function DELETE(req: NextRequest) {
    const auth = await getAdminIdentityWithRole(req, ["admin", "editor"]);
    if ("error" in auth) return auth.error;
    const id = req.nextUrl.searchParams.get(campo);
    if (!id)
      return NextResponse.json(
        { error: `${campo} obrigatório.` },
        { status: 400 },
      );
    try {
      const db = getDb();
      const [atual] = await db
        .select({ foto_url: t.foto_url })
        .from(t)
        .where(eq(t.id, id))
        .limit(1);
      if (!atual)
        return NextResponse.json(
          { error: "Registro não encontrado." },
          { status: 404 },
        );
      await db.update(t).set({ foto_url: null }).where(eq(t.id, id));
      await removerImagem(atual.foto_url, `${pasta}/${id}`);
      await recordAuditLog({
        admin: auth,
        acao: "FOTO_REMOVIDA",
        entidade,
        entidadeId: id,
      });
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error("Erro ao remover foto:", error);
      return NextResponse.json({ error: "Erro interno." }, { status: 500 });
    }
  }

  return { POST, DELETE };
}
