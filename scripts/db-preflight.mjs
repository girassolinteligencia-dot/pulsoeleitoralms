import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const expectedTables = [
  'campanhas',
  'atributos',
  'campanha_atributos',
  'candidatos',
  'manifestacoes',
  'avaliacoes',
  'bloqueios',
  'audit_logs',
  'parametros_plataforma',
  'rodadas_metodologicas',
  'ceps_ms',
];

function mask(value) {
  if (!value) return '(not set)';
  if (value.length <= 18) return '(set)';
  return `${value.slice(0, 12)}...${value.slice(-6)}`;
}

async function main() {
  console.log('PULSO ELEITORAL MS - Database preflight');
  console.log(`DATABASE_URL: ${mask(process.env.DATABASE_URL)}`);

  const [connection] = await prisma.$queryRaw`
    SELECT
      current_database() AS database,
      current_user AS user_name,
      inet_server_addr()::text AS host,
      inet_server_port() AS port
  `;

  console.log('\nConnection');
  console.table([connection]);

  const tables = await prisma.$queryRaw`
    SELECT
      c.relname AS table_name,
      c.relrowsecurity AS rls_enabled,
      c.relforcerowsecurity AS rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname = ANY(${expectedTables})
    ORDER BY c.relname
  `;

  console.log('\nTables and RLS');
  console.table(tables);

  const foundTables = new Set(tables.map((table) => table.table_name));
  const missingTables = expectedTables.filter((table) => !foundTables.has(table));

  if (missingTables.length) {
    console.log('\nMissing expected tables');
    console.table(missingTables.map((table) => ({ table })));
  }

  const policies = await prisma.$queryRaw`
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY(${expectedTables})
    ORDER BY tablename, policyname
  `;

  console.log('\nRLS policies');
  console.table(policies);

  const migrations = await prisma.$queryRaw`
    SELECT
      migration_name,
      finished_at,
      rolled_back_at
    FROM _prisma_migrations
    ORDER BY started_at
  `.catch((error) => {
    if (error?.code === 'P2010') return [];
    throw error;
  });

  console.log('\nPrisma migrations');
  if (migrations.length) {
    console.table(migrations);
  } else {
    console.log('_prisma_migrations not found or empty. Baseline resolution may still be required.');
  }

  const rlsMissing = tables
    .filter((table) => !table.rls_enabled)
    .map((table) => table.table_name);

  if (rlsMissing.length) {
    console.log('\nRLS disabled on expected tables');
    console.table(rlsMissing.map((table) => ({ table })));
  }

  console.log('\nPreflight finished.');
}

main()
  .catch((error) => {
    console.error('Preflight failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
