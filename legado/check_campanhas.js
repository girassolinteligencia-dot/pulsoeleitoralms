
const { PrismaClient } = require('@prisma/client');

async function checkCampanhas() {
  const prisma = new PrismaClient();
  try {
    const campanhas = await prisma.campanha.findMany({
      include: {
        _count: {
          select: { atributos: true }
        }
      }
    });
    console.log('Campanhas:', JSON.stringify(campanhas, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkCampanhas();
