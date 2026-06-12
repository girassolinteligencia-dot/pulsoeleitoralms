import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Verificando colunas de avaliacoes...');
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'avaliacoes'
    `;
    console.log('Colunas encontradas:', columns);
  } catch (error) {
    console.error('Erro ao verificar colunas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
