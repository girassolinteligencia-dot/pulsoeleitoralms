import "server-only";
import type { DB } from "@/server/db/client";
import { auditLogs } from "@/server/db/schema";

export type AuditActor = { id: string; email: string };

export async function recordAuditLog(
  db: DB,
  input: {
    admin: AuditActor;
    acao: string;
    entidade: string;
    entidadeId: string;
    detalhes?: unknown;
  },
) {
  const detalhes =
    input.detalhes === undefined
      ? { admin_email: input.admin.email }
      : { admin_email: input.admin.email, detalhes: input.detalhes };
  try {
    await db.insert(auditLogs).values({
      acao: input.acao,
      entidade: input.entidade,
      entidade_id: input.entidadeId,
      usuario_id: input.admin.id,
      detalhes: detalhes as Record<string, unknown>,
    });
  } catch (error) {
    console.error("Erro ao registrar AuditLog:", error);
  }
}
