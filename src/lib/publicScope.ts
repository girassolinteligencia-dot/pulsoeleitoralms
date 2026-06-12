import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type PublicScopeMode = 'all_active' | 'selected_campaigns';

export type PublicScopeConfig = {
  mode: PublicScopeMode;
  anosAtivos: number[];
  campanhasAtivas: string[];
};

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 1900 && item <= 2100);
}

export async function getPublicScopeConfig(): Promise<PublicScopeConfig> {
  const parametros = await prisma.parametroPlataforma.findMany({
    where: {
      chave: {
        in: ['public_scope_mode', 'public_anos_ativos', 'public_campanhas_ativas'],
      },
    },
    select: {
      chave: true,
      valor: true,
    },
  });

  const values = new Map(parametros.map((parametro) => [parametro.chave, parametro.valor]));
  const mode = asString(values.get('public_scope_mode'));

  return {
    mode: mode === 'selected_campaigns' ? 'selected_campaigns' : 'all_active',
    anosAtivos: asNumberArray(values.get('public_anos_ativos')),
    campanhasAtivas: asStringArray(values.get('public_campanhas_ativas')),
  };
}

export function buildPublicCandidateWhere(
  config: PublicScopeConfig,
  extraWhere: Prisma.CandidatoWhereInput = {}
): Prisma.CandidatoWhereInput {
  return {
    status: 'Ativo',
    campanha: {
      status: 'ativo',
    },
    ...(config.anosAtivos.length > 0 ? { ano_eleicao: { in: config.anosAtivos } } : {}),
    ...(config.mode === 'selected_campaigns'
      ? { campanha_id: { in: config.campanhasAtivas.length > 0 ? config.campanhasAtivas : ['__none__'] } }
      : {}),
    ...extraWhere,
  };
}
