import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config({ path: '.env.local' });
config({ path: '.env' });

const prisma = new PrismaClient();

const apply = process.argv.includes('--apply');
const daysArg = process.argv.find((arg) => arg.startsWith('--days='));
const days = Number(daysArg?.split('=')[1] || process.env.AUDIT_LOG_RETENTION_DAYS || 365);

if (!Number.isFinite(days) || days < 30) {
  console.error('Retention must be at least 30 days. Use --days=365 or AUDIT_LOG_RETENTION_DAYS=365.');
  process.exit(1);
}

const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - Math.floor(days));

try {
  const total = await prisma.auditLog.count();
  const expired = await prisma.auditLog.count({
    where: {
      criado_em: { lt: cutoff },
    },
  });

  console.log('PULSO ELEITORAL MS - AuditLog retention');
  console.log(`Retention window: ${Math.floor(days)} day(s)`);
  console.log(`Cutoff: ${cutoff.toISOString()}`);
  console.log(`Total audit logs: ${total}`);
  console.log(`Expired audit logs: ${expired}`);

  if (!apply) {
    console.log('Dry-run only. Re-run with --apply to delete expired audit logs.');
    process.exit(0);
  }

  const result = await prisma.auditLog.deleteMany({
    where: {
      criado_em: { lt: cutoff },
    },
  });

  console.log(`Deleted audit logs: ${result.count}`);
} catch (error) {
  console.error('AuditLog retention failed:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
