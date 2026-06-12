const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const params = [
    {
      chave: 'fluxo_limite_positivos',
      valor: 5,
      grupo: 'geral',
      descricao: 'Quantidade de atributos positivos exibidos no fluxo de avaliação'
    },
    {
      chave: 'fluxo_limite_negativos',
      valor: 5,
      grupo: 'geral',
      descricao: 'Quantidade de atributos negativos exibidos no fluxo de avaliação'
    },
    {
      chave: 'fluxo_minimo_selecao',
      valor: 5,
      grupo: 'geral',
      descricao: 'Quantidade mínima de atributos que o usuário deve selecionar'
    }
  ];

  for (const p of params) {
    await prisma.parametroPlataforma.upsert({
      where: { chave: p.chave },
      update: { valor: p.valor, descricao: p.descricao },
      create: p
    });
  }
  console.log('Parameters seeded successfully');
}

seed().finally(() => prisma.$disconnect());
