import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  try {
    const columns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'campanhas'`;
    console.log('Column names in campanhas:', JSON.stringify(columns, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
