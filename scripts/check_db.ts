import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Verificando tabelas...');
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('Tabelas encontradas:', tables);
  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
