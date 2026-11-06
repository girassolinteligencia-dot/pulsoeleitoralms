const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3010';

let failures = 0;

function record(ok, label, details) {
  const marker = ok ? 'OK' : 'FAIL';
  console.log(`${marker} ${label}${details ? ` - ${details}` : ''}`);
  if (!ok) failures += 1;
}

async function fetchJson(path) {
  const startedAt = Date.now();
  const res = await fetch(`${baseUrl}${path}`);
  const data = await res.json().catch(() => null);
  return { res, data, responseMs: Date.now() - startedAt };
}

console.log('PULSO ELEITORAL MS - Operational smoke');
console.log(`App base URL: ${baseUrl}`);

const health = await fetchJson('/api/health');
record(
  health.res.ok &&
    health.data?.service === 'pulso-eleitoral-ms' &&
    ['ok', 'degraded'].includes(health.data?.status) &&
    health.data?.checks?.database === 'ok' &&
    health.data?.checks?.activeCampaigns === 'ok' &&
    health.data?.checks?.publicCandidates === 'ok' &&
    health.data?.checks?.cepsMs === 'ok' &&
    Number.isFinite(health.data?.metrics?.publicCandidates) &&
    health.data.metrics.publicCandidates > 0 &&
    Number.isFinite(health.data?.metrics?.cepsMs) &&
    health.data.metrics.cepsMs > 0 &&
    Number.isFinite(health.data?.metrics?.responseMs),
  'health contract is operational',
  `status ${health.res.status}, response ${health.responseMs}ms`
);

record(
  Number.isFinite(health.data?.metrics?.databaseMs) &&
    health.data.metrics.databaseMs >= 0 &&
    health.data.metrics.databaseMs < 5000,
  'database latency is measurable',
  `${health.data?.metrics?.databaseMs ?? 'n/a'}ms`
);

record(
  Number.isFinite(health.data?.metrics?.cepsBaixaConfiancaPct) &&
    health.data.metrics.cepsBaixaConfiancaPct >= 0 &&
    health.data.metrics.cepsBaixaConfiancaPct <= 100,
  'CEP confidence metric is bounded',
  `${health.data?.metrics?.cepsBaixaConfiancaPct ?? 'n/a'}%`
);

if (failures > 0) {
  console.error(`Operational smoke failed with ${failures} failure(s).`);
  process.exit(1);
}

console.log('Operational smoke passed.');
