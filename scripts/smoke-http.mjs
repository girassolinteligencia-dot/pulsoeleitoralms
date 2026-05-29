const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3010';
const defaultDelayMs = baseUrl.startsWith('https://') ? 1500 : 0;
const delayMs = Number(process.env.SMOKE_DELAY_MS || defaultDelayMs);

const checks = [
  { path: '/', expected: 200 },
  { path: '/avaliar', expected: 200 },
  { path: '/admin/login', expected: 200 },
  { path: '/admin/metodologia', expected: 200 },
  { path: '/admin/auditoria', expected: 200 },
  { path: '/admin/territorio', expected: 200 },
  { path: '/api/candidatos', expected: 200 },
  { path: '/api/health', expected: 200 },
  { path: '/api/configuracoes/public', expected: 200 },
  { path: '/api/admin/stats', expected: 401 },
  { path: '/api/admin/export', expected: 401 },
  { path: '/api/admin/relatorios', expected: 401 },
  { path: '/api/admin/rodadas', expected: 401 },
  { path: '/api/admin/audit-logs', expected: 401 },
  { path: '/api/admin/ceps', expected: 401 },
  { path: '/api/admin/rodadas/smoke/dossie', expected: 401 },
];

const postChecks = [
  {
    path: '/api/avaliar',
    expected: 400,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    },
  },
  {
    path: '/api/avaliar/session',
    expected: 400,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    },
  },
];

const jsonChecks = [
  {
    path: '/api/candidatos?cidade=Campo%20Grande&bairro=Centro',
    validate: data => Array.isArray(data) && data.length > 0,
    description: 'candidate search ignores respondent geography filters',
  },
  {
    path: '/api/candidatos?search=VEREADOR',
    validate: data => Array.isArray(data) && data.length > 0,
    description: 'candidate search matches cargo',
  },
  {
    path: '/api/candidatos?search=CAMPO%20GRANDE',
    validate: data => Array.isArray(data) && data.length > 0,
    description: 'candidate search matches candidate city',
  },
  {
    path: '/api/health',
    validate: data => (
      data?.service === 'pulso-eleitoral-ms' &&
      data?.status === 'ok' &&
      data?.checks?.database === 'ok' &&
      data?.checks?.activeCampaigns === 'ok' &&
      data?.checks?.publicCandidates === 'ok' &&
      data?.checks?.cepsMs === 'ok' &&
      Number.isFinite(data?.metrics?.publicCandidates) &&
      Number.isFinite(data?.metrics?.cepsMs) &&
      data.metrics.publicCandidates > 0
    ),
    description: 'production healthcheck is ok',
  },
];

let failures = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCheck({ path, expected, init }) {
  if (delayMs > 0) await sleep(delayMs);
  const res = await fetch(`${baseUrl}${path}`, init);
  const ok = res.status === expected;
  const marker = ok ? 'OK' : 'FAIL';

  console.log(`${marker} ${path} -> ${res.status} expected ${expected}`);

  if (!ok) failures += 1;
}

for (const check of checks) {
  await runCheck(check);
}

for (const check of postChecks) {
  await runCheck(check);
}

for (const check of jsonChecks) {
  if (delayMs > 0) await sleep(delayMs);
  const res = await fetch(`${baseUrl}${check.path}`);
  const data = await res.json().catch(() => null);
  const ok = res.ok && check.validate(data);
  const marker = ok ? 'OK' : 'FAIL';
  const count = Array.isArray(data)
    ? data.length
    : Number.isFinite(data?.metrics?.publicCandidates)
      ? data.metrics.publicCandidates
      : 'invalid-json';

  console.log(`${marker} ${check.path} -> ${res.status}, count ${count} (${check.description})`);

  if (!ok) failures += 1;
}

if (failures > 0) {
  console.error(`Smoke test failed with ${failures} failure(s).`);
  process.exit(1);
}

console.log('Smoke test passed.');
