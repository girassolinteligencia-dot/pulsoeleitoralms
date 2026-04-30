
const { PrismaClient } = require('@prisma/client');

async function checkAtributos() {
  const prisma = new PrismaClient();
  try {
    const atributos = await prisma.atributo.findMany();
    console.log('Atributos in DB:', JSON.stringify(atributos, null, 2));
    
    const count = await prisma.atributo.count();
    console.log('Total atributos:', count);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkAtributos();
