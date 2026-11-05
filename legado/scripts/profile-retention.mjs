import { config } from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';

config({ path: '.env.local' });
config({ path: '.env' });

const prisma = new PrismaClient();

const apply = process.argv.includes('--apply');
const daysArg = process.argv.find((arg) => arg.startsWith('--days='));
const days = Number(daysArg?.split('=')[1] || process.env.PROFILE_RETENTION_DAYS || 730);
const batchSize = 250;

const TERRITORIAL_FIELDS = [
  'cidade',
  'bairro',
  'uf',
  'localidadeOrigem',
  'bairroConfianca',
];

if (!Number.isFinite(days) || days < 90) {
  console.error('Profile retention must be at least 90 days. Use --days=730 or PROFILE_RETENTION_DAYS=730.');
  process.exit(1);
}

function compactPerfil(perfil) {
  if (!perfil || typeof perfil !== 'object' || Array.isArray(perfil)) return {};

  const compacted = {};
  for (const field of TERRITORIAL_FIELDS) {
    if (perfil[field] !== undefined && perfil[field] !== null && perfil[field] !== '') {
      compacted[field] = perfil[field];
    }
  }

  compacted.retencaoPerfilAplicada = true;
  compacted.retencaoPerfilAplicadaEm = new Date().toISOString();
  return compacted;
}

function hasDemographicProfile(perfil) {
  if (!perfil || typeof perfil !== 'object' || Array.isArray(perfil)) return false;
  if (perfil.retencaoPerfilAplicada === true) return false;
  return Object.keys(perfil).some((field) => !TERRITORIAL_FIELDS.includes(field));
}

const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - Math.floor(days));

let scanned = 0;
let eligible = 0;
let updated = 0;
let cursor = undefined;

try {
  const expiredTotal = await prisma.manifestacao.count({
    where: {
      criado_em: { lt: cutoff },
      perfil: { not: Prisma.JsonNull },
    },
  });

  console.log('PULSO ELEITORAL MS - Profile retention');
  console.log(`Retention window: ${Math.floor(days)} day(s)`);
  console.log(`Cutoff: ${cutoff.toISOString()}`);
  console.log(`Expired profiles to inspect: ${expiredTotal}`);

  while (true) {
    const batch = await prisma.manifestacao.findMany({
      where: {
        criado_em: { lt: cutoff },
        perfil: { not: Prisma.JsonNull },
      },
      select: {
        id: true,
        perfil: true,
      },
      orderBy: {
        id: 'asc',
      },
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    if (batch.length === 0) break;

    for (const item of batch) {
      scanned++;
      cursor = item.id;

      if (!hasDemographicProfile(item.perfil)) continue;
      eligible++;

      if (!apply) continue;

      await prisma.manifestacao.update({
        where: { id: item.id },
        data: {
          perfil: compactPerfil(item.perfil),
        },
      });
      updated++;
    }
  }

  console.log(`Scanned profiles: ${scanned}`);
  console.log(`Eligible for minimization: ${eligible}`);

  if (!apply) {
    console.log('Dry-run only. Re-run with --apply to minimize expired profiles.');
    process.exit(0);
  }

  console.log(`Minimized profiles: ${updated}`);
} catch (error) {
  console.error('Profile retention failed:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
