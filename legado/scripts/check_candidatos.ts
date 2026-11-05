import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const candidatos = await prisma.candidato.findMany({
    include: { campanha: true }
  });
  console.log(JSON.stringify(candidatos, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
