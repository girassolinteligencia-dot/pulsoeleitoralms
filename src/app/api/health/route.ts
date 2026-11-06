import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { campanhas, candidatos } from '@/server/db/schema';
import { getPublicScopeConfig, publicCandidateConditions } from '@/server/repos/scope';

export const dynamic = 'force-dynamic';

type HealthStatus = 'ok' | 'degraded';
type CheckStatus = 'ok' | 'degraded' | 'unknown';

function checkStatus(condition: boolean): CheckStatus {
  return condition ? 'ok' : 'degraded';
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
    const db = getDb();
    const dbStartedAt = Date.now();
    await db.run(sql`select 1`);
    const databaseMs = Date.now() - dbStartedAt;

    const scopeConfig = await getPublicScopeConfig(db);
    const now = Date.now();
    const since24h = now - 24 * 60 * 60 * 1000;
    const since7d = now - 7 * 24 * 60 * 60 * 1000;

    const [[publicRow], [m]] = await Promise.all([
      db
        .select({ n: sql<number>`count(*)` })
        .from(candidatos)
        .innerJoin(campanhas, sql`${campanhas.id} = ${candidatos.campanha_id}`)
        .where(publicCandidateConditions(scopeConfig)),
      db.all<Record<string, number>>(sql`
        select
          (select count(*) from campanhas where status = 'ativo') as activeCampaigns,
          (select count(*) from ceps_ms) as cepsMs,
          (select count(*) from rodadas_metodologicas where status = 'ativa') as activeRodadas,
          (select count(*) from ceps_ms where bairro_confianca < 0.8) as cepsBaixaConfianca,
          (select count(*) from manifestacoes where criado_em >= ${since24h}) as manifestacoes24h,
          (select count(*) from avaliacoes where criado_em >= ${since24h}) as avaliacoes24h,
          (select count(*) from audit_logs where criado_em >= ${since7d}) as auditLogs7d,
          (select count(*) from bloqueios where expira_em is null or expira_em > ${now}) as bloqueiosAtivos
      `),
    ]);
    const publicCandidates = publicRow?.n ?? 0;
    const { activeCampaigns, cepsMs, activeRodadas, cepsBaixaConfianca, manifestacoes24h, avaliacoes24h, auditLogs7d, bloqueiosAtivos } = m;

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
