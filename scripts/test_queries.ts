import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando teste de queries...');
    const start = Date.now();
    
    console.log('Contando avaliações...');
    const totalEvaluations = await prisma.avaliacao.count();
    console.log('Total Avaliações: ' + totalEvaluations);
    
    console.log('Buscando avaliações recentes...');
    const recent = await prisma.avaliacao.findMany({
      take: 10,
      orderBy: { criado_em: 'desc' },
      include: {
        candidato: { select: { nome: true } },
        atributo: { select: { nome: true } }
      }
    });
    console.log('Recentes: ' + recent.length);
    
    const end = Date.now();
    console.log('Teste concluído em ' + (end - start) + 'ms');
  } catch (error) {
    console.error('Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
