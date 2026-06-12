const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanCandidates() {
  console.log('Iniciando limpeza de candidatos (Fase Extra)...');
  
  const candidatos = await prisma.candidato.findMany();
  
  const titles = [
    'DR\\.', 'DRA\\.', 'DR', 'DRA', 
    'DEPUTADO', 'DEPUTADA', 'DEP\\.', 'DEP', 
    'VEREADOR', 'VEREADORA', 'VER\\.', 'VER',
    'PREFEITO', 'PREFEITA', 'PREF\\.', 'PREF',
    'GOVERNADOR', 'GOVERNADORA', 'GOV\\.', 'GOV',
    'SENADOR', 'SENADORA', 'SEN\\.', 'SEN',
    'PROFESSOR', 'PROFESSORA', 'PROF\\.', 'PROF',
    'BISPO', 'BISPA', 'PASTOR', 'PASTORA', 'PR\\.', 'PR',
    'CABO', 'SARGENTO', 'SGT\\.', 'SGT', 'CORONEL', 'TENENTE', 'TEN\\.', 'TEN', 'MAJOR', 'DELEGADO', 'DELEGADA', 'DEL\\.', 'DEL',
    'IRMÃO', 'IRMÃ', 'IR\\.', 'IR'
  ];

  for (const cand of candidatos) {
    let newNome = cand.nome.trim();
    let changed = false;

    // Remover títulos do início do nome (case insensitive)
    for (const title of titles) {
      const regex = new RegExp(`^${title}\\s+`, 'i');
      if (regex.test(newNome)) {
        const old = newNome;
        newNome = newNome.replace(regex, '').trim();
        if (old !== newNome) {
          changed = true;
          console.log(`Limpando Extra: "${cand.nome}" -> "${newNome}"`);
        }
      }
    }

    if (changed) {
      await prisma.candidato.update({
        where: { id: cand.id },
        data: { nome: newNome }
      });
    }
  }

  console.log('Limpeza de nomes concluída.');

  // Auditoria de duplicados
  console.log('Iniciando auditoria de duplicados...');
  
  const allCands = await prisma.candidato.findMany({
    orderBy: { ano_eleicao: 'desc' }
  });

  const seen = new Set();
  const toHide = [];
  const toShow = [];

  for (const cand of allCands) {
    const key = `${cand.nome.toLowerCase().trim()}`;
    if (seen.has(key)) {
      if (cand.status !== 'Inativo') toHide.push(cand.id);
    } else {
      seen.add(key);
      if (cand.status === 'Inativo') toShow.push(cand.id);
    }
  }

  if (toHide.length > 0) {
    console.log(`Ocultando ${toHide.length} candidatos duplicados mais antigos...`);
    // Batch updates for performance
    for (let i = 0; i < toHide.length; i += 500) {
        const chunk = toHide.slice(i, i + 500);
        await prisma.candidato.updateMany({
          where: { id: { in: chunk } },
          data: { status: 'Inativo' }
        });
    }
  }
  
  if (toShow.length > 0) {
      console.log(`Reativando ${toShow.length} candidatos que agora são os únicos/mais recentes...`);
      for (let i = 0; i < toShow.length; i += 500) {
          const chunk = toShow.slice(i, i + 500);
          await prisma.candidato.updateMany({
            where: { id: { in: chunk } },
            data: { status: 'Ativo' }
          });
      }
  }

  console.log('Auditoria concluída.');
}

cleanCandidates()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
