import "server-only";

import { getDb } from "@/server/db/client";
import { recordAuditLog as record } from "@/server/audit";
import type { AdminIdentity } from "@/lib/adminAuth";

type AuditInput = {
  admin: AdminIdentity;
  acao: string;
  entidade: string;
  entidadeId: string;
  detalhes?: unknown;
};

/** Registra ação administrativa (não lança erro: falha de auditoria só é logada). */
export async function recordAuditLog(input: AuditInput) {
  await record(getDb(), input);
}
