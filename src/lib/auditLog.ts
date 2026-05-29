import 'server-only';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AdminIdentity } from '@/lib/adminAuth';

type AuditInput = {
  admin: AdminIdentity;
  acao: string;
  entidade: string;
  entidadeId: string;
  detalhes?: Prisma.InputJsonValue;
};

export async function recordAuditLog({
  admin,
  acao,
  entidade,
  entidadeId,
  detalhes,
}: AuditInput) {
  const detalhesJson = detalhes === undefined
    ? { admin_email: admin.email }
    : {
        admin_email: admin.email,
        detalhes,
      };

  try {
    await prisma.auditLog.create({
      data: {
        acao,
        entidade,
        entidade_id: entidadeId,
        usuario_id: admin.id,
        detalhes: detalhesJson,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar AuditLog:', error);
  }
}
