import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildPublicCandidateWhere, getPublicScopeConfig } from '@/lib/publicScope';

export const dynamic = 'force-dynamic';

type HealthStatus = 'ok' | 'degraded';
type CheckStatus = 'ok' | 'degraded' | 'unknown';

function checkStatus(condition: boolean): CheckStatus {
  return condition ? 'ok' : 'degraded';
}

async function safeMetric<T>(label: string, getter: () => Promise<T>, fallback: T) {
  try {
    return await getter();
  } catch (error) {
    console.error(`Health metric failed: ${label}`, error);
    return fallback;
  }
}

function buildResponse(status: HealthStatus, body: Record<string, unknown>, httpStatus = 200) {
  return NextResponse.json(
    {
      service: 'pulso-eleitoral-ms',
      status,
      timestamp: new Date().toISOString(),
      ...body,
    },
    {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

export async function GET() {
  const startedAt = Date.now();

  try {
    const dbStartedAt = Date.now();
    await prisma.$queryRaw`select 1`;
    const databaseMs = Date.now() - dbStartedAt;

    const scopeConfig = await getPublicScopeConfig();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const activeCampaigns = await prisma.campanha.count({
      where: {
        status: 'ativo',
      },
    });
    const publicCandidates = await prisma.candidato.count({
      where: buildPublicCandidateWhere(scopeConfig),
    });
    const cepsMs = await safeMetric('ceps_ms.total', () => prisma.cepMs.count(), 0);

    const [
      activeRodadas,
      cepsBaixaConfianca,
      manifestacoes24h,
      avaliacoes24h,
      auditLogs7d,
      bloqueiosAtivos,
    ] = await Promise.all([
      safeMetric('rodadas.ativas', () => prisma.rodadaMetodologica.count({
        where: {
          status: 'ativa',
        },
      }), 0),
      safeMetric('ceps_ms.baixa_confianca', () => prisma.cepMs.count({
        where: {
          bairro_confianca: {
            lt: 0.8,
          },
        },
      }), 0),
      safeMetric('manifestacoes.24h', () => prisma.manifestacao.count({
        where: {
          criado_em: {
            gte: since24h,
          },
        },
      }), 0),
      safeMetric('avaliacoes.24h', () => prisma.avaliacao.count({
        where: {
          criado_em: {
            gte: since24h,
          },
        },
      }), 0),
      safeMetric('audit_logs.7d', () => prisma.auditLog.count({
        where: {
          criado_em: {
            gte: since7d,
          },
        },
      }), 0),
      safeMetric('bloqueios.ativos', () => prisma.bloqueio.count({
        where: {
          OR: [
            { expira_em: null },
            { expira_em: { gt: new Date() } },
          ],
        },
      }), 0),
    ]);

    const coreOk = activeCampaigns > 0 && publicCandidates > 0 && cepsMs > 0;
    const status: HealthStatus = coreOk ? 'ok' : 'degraded';
    const cepsBaixaConfiancaPct = cepsMs > 0 ? Math.round((cepsBaixaConfianca / cepsMs) * 100) : 0;

    return buildResponse(
      status,
      {
        checks: {
          database: 'ok',
          activeCampaigns: checkStatus(activeCampaigns > 0),
          publicCandidates: checkStatus(publicCandidates > 0),
          cepsMs: checkStatus(cepsMs > 0),
          rodadasAtivas: activeRodadas > 0 ? 'ok' : 'degraded',
          recentTraffic: manifestacoes24h > 0 ? 'ok' : 'degraded',
        },
        publicScope: {
          mode: scopeConfig.mode,
          anosAtivos: scopeConfig.anosAtivos.length,
          campanhasAtivas: scopeConfig.campanhasAtivas.length,
        },
        metrics: {
          activeCampaigns,
          publicCandidates,
          activeRodadas,
          cepsMs,
          cepsBaixaConfianca,
          cepsBaixaConfiancaPct,
          manifestacoes24h,
          avaliacoes24h,
          auditLogs7d,
          bloqueiosAtivos,
          databaseMs,
          responseMs: Date.now() - startedAt,
        },
      },
      coreOk ? 200 : 503
    );
  } catch (error) {
    console.error('Healthcheck failed:', error);

    return buildResponse(
      'degraded',
      {
        checks: {
          database: 'degraded',
          activeCampaigns: 'unknown',
          publicCandidates: 'unknown',
          cepsMs: 'unknown',
          rodadasAtivas: 'unknown',
          recentTraffic: 'unknown',
        },
        metrics: {
          responseMs: Date.now() - startedAt,
        },
      },
      503
    );
  }
}
