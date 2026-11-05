import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  try {
    await prisma.$executeRaw`ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo'`;
    console.log('✅ Coluna status adicionada com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
