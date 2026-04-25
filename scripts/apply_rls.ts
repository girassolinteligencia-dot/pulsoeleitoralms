import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.join(process.cwd(), 'prisma/apply_rls.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split by semicolon and filter empty lines to run one by one to avoid pooler issues
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Applying ${statements.length} SQL statements...`);

  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await prisma.$executeRawUnsafe(statement);
    } catch (error: any) {
      // Ignore "already exists" errors for policies and views
      if (error.message.includes('already exists')) {
        console.warn(`Statement already applied: ${statement.substring(0, 30)}`);
      } else {
        console.error(`Error executing statement: ${error.message}`);
      }
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
