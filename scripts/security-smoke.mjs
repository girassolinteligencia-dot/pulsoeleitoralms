import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3010';
const defaultDelayMs = baseUrl.startsWith('https://') ? 750 : 0;
const delayMs = Number(process.env.SMOKE_DELAY_MS || defaultDelayMs);
const adminToken = process.env.ADMIN_SMOKE_TOKEN;
const requireAdminSmoke = process.argv.includes('--require-admin') || process.env.REQUIRE_ADMIN_SMOKE === '1';

const sensitiveTables = [
  'manifestacoes',
  'avaliacoes',
  'bloqueios',
  'audit_logs',
];

const publicTables = [
  'campanhas',
  'atributos',
  'campanha_atributos',
  'candidatos',
  'parametros_plataforma',
  'rodadas_metodologicas',
  'ceps_ms',
];

const adminChecks = [
  '/api/admin/stats',
  '/api/admin/rodadas',
  '/api/admin/relatorios',
  '/api/admin/audit-logs',
  '/api/admin/ceps',
];

let failures = 0;
let skipped = 0;
let warnings = 0;

function record(ok, label, details) {
  const marker = ok ? 'OK' : 'FAIL';
  console.log(`${marker} ${label}${details ? ` - ${details}` : ''}`);
  if (!ok) failures += 1;
}

function warn(label, details) {
  warnings += 1;
  console.log(`WARN ${label}${details ? ` - ${details}` : ''}`);
}

async function readTable(table) {
  if (delayMs > 0) await sleep(delayMs);
  const url = `${supabaseUrl}/rest/v1/${table}?select=id&limit=1`;
  return fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkSensitiveTable(table) {
  const res = await readTable(table);
  const text = await res.text();

  if (!res.ok) {
    record(true, `anon direct read blocked: ${table}`, `status ${res.status}`);
    return;
  }

  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    record(false, `anon direct read parse: ${table}`, text.slice(0, 120));
    return;
  }

  record(
    Array.isArray(data) && data.length === 0,
    `anon direct read empty: ${table}`,
    `${data.length} row(s)`
  );
}

async function checkPublicTable(table) {
  const res = await readTable(table);
  if (res.ok) {
    record(true, `anon public catalogue read: ${table}`, `status ${res.status}`);
    return;
  }

  warn(`anon public catalogue unavailable: ${table}`, `status ${res.status}`);
}

async function checkAdminRoute(path) {
  if (!adminToken) {
    if (requireAdminSmoke) {
      record(false, `admin authenticated route: ${path}`, 'ADMIN_SMOKE_TOKEN not set');
      return;
    }

    skipped += 1;
    console.log(`SKIP admin authenticated route: ${path} - ADMIN_SMOKE_TOKEN not set`);
    return;
  }

  if (delayMs > 0) await sleep(delayMs);
  const res = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  record(res.ok, `admin authenticated route: ${path}`, `status ${res.status}`);
}

if (!supabaseUrl || !anonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
  process.exit(1);
}

console.log('PULSO ELEITORAL MS - Security smoke');
console.log(`Supabase REST: ${supabaseUrl}/rest/v1`);
console.log(`App base URL: ${baseUrl}`);
console.log(`Admin authenticated checks: ${requireAdminSmoke ? 'required' : 'optional'}`);

for (const table of sensitiveTables) {
  await checkSensitiveTable(table);
}

for (const table of publicTables) {
  await checkPublicTable(table);
}

for (const path of adminChecks) {
  await checkAdminRoute(path);
}

if (failures > 0) {
  console.error(`Security smoke failed with ${failures} failure(s).`);
  process.exit(1);
}

const suffix = [
  skipped ? `${skipped} authenticated check(s) skipped` : '',
  warnings ? `${warnings} warning(s)` : '',
].filter(Boolean).join('. ');

console.log(`Security smoke passed.${suffix ? ` ${suffix}.` : ''}`);
