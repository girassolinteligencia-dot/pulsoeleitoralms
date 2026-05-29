import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type RodadaContext = {
  id: string;
  titulo: string;
  tipo: string;
  status: string;
  campanha_id: string | null;
  periodo_inicio: Date | null;
  periodo_fim: Date | null;
  campanha: {
    nome: string;
    slug: string;
  } | null;
};

type ScopeInput = {
  rodadaId?: string | null;
  dias?: number;
};

function subtractDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function normalizeDays(value: number | undefined) {
  if (!value || !Number.isFinite(value)) return 30;
  return Math.min(3650, Math.max(1, Math.floor(value)));
}

export async function resolveRodadaScope({ rodadaId, dias }: ScopeInput) {
  const normalizedDays = normalizeDays(dias);
  const rodada = rodadaId
    ? await prisma.rodadaMetodologica.findUnique({
        where: { id: rodadaId },
        select: {
          id: true,
          titulo: true,
          tipo: true,
          status: true,
          campanha_id: true,
          periodo_inicio: true,
          periodo_fim: true,
          campanha: {
            select: {
              nome: true,
              slug: true,
            },
          },
        },
      })
    : null;

  const startDate = rodada?.periodo_inicio || subtractDays(new Date(), normalizedDays);
  const endDate = rodada?.periodo_fim ? endOfDay(rodada.periodo_fim) : null;
  const dateFilter = {
    gte: startDate,
    ...(endDate ? { lte: endDate } : {}),
  };
  const campanhaFilter = rodada?.campanha_id
    ? { candidato: { campanha_id: rodada.campanha_id } }
    : {};

  const avaliacaoWhere: Prisma.AvaliacaoWhereInput = {
    criado_em: dateFilter,
    is_valid: true,
    ...campanhaFilter,
  };

  const manifestacaoWhere: Prisma.ManifestacaoWhereInput = {
    criado_em: dateFilter,
    is_valid: true,
    ...campanhaFilter,
  };

  const candidatoWhere: Prisma.CandidatoWhereInput = {
    status: 'Ativo',
    ...(rodada?.campanha_id ? { campanha_id: rodada.campanha_id } : {}),
  };

  return {
    rodada,
    dias: normalizedDays,
    startDate,
    endDate,
    avaliacaoWhere,
    manifestacaoWhere,
    candidatoWhere,
  };
}
