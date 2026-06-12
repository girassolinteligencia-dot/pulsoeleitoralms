const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkParams() {
  try {
    const params = await prisma.parametroPlataforma.findMany();
    console.log('Parameters in DB:', JSON.stringify(params, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkParams();
