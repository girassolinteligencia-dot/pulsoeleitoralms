const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const total = await prisma.candidato.count();
  const ativos = await prisma.candidato.count({ where: { status: 'Ativo' } });
  const inativos = await prisma.candidato.count({ where: { status: 'Inativo' } });
  const marquinhos = await prisma.candidato.findMany({ 
    where: { nome: { contains: 'Marquinhos Trad', mode: 'insensitive' } },
    orderBy: { ano_eleicao: 'desc' }
  });

  console.log(`Total: ${total}`);
  console.log(`Ativos: ${ativos}`);
  console.log(`Inativos: ${inativos}`);
  console.log('Casos Marquinhos Trad:');
  marquinhos.forEach(m => console.log(`- ${m.nome} (${m.ano_eleicao}) [${m.status}]`));
}

check().catch(console.error).finally(() => prisma.$disconnect());
