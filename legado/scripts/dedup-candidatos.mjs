/**
 * Higienização de candidatos duplicados.
 *
 * Critério de duplicata: mesmo nome normalizado + cargo + ano_eleicao + cidade.
 * Critério de sobrevivência: preferir quem tem foto_url; em empate, manter o id
 * lexicograficamente maior (cuid é ordenado por criação — o maior é o mais recente).
 *
 * Uso:
 *   node scripts/dedup-candidatos.mjs            # dry-run (só lista)
 *   node scripts/dedup-candidatos.mjs --apply    # executa exclusão no banco
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

function normalizar(str) {
  return str
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

async function main() {
  console.log(`\nModo: ${apply ? 'APPLY — exclusões serão executadas' : 'DRY-RUN — nenhuma alteração'}\n`);

  const todos = await prisma.candidato.findMany({
    select: {
      id: true,
      nome: true,
      cargo: true,
      ano_eleicao: true,
      cidade: true,
      foto_url: true,
      total_avaliacoes: true,
    },
  });

  // Agrupar por chave de duplicata
  const grupos = new Map();
  for (const c of todos) {
    const chave = [normalizar(c.nome), normalizar(c.cargo), c.ano_eleicao, normalizar(c.cidade)].join('|');
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(c);
  }

  const duplicatas = [...grupos.values()].filter((g) => g.length > 1);

  if (duplicatas.length === 0) {
    console.log('Nenhum duplicado encontrado.');
    return;
  }

  console.log(`Grupos duplicados encontrados: ${duplicatas.length}\n`);

  let totalRemover = 0;
  const idsRemover = [];

  for (const grupo of duplicatas) {
    // Ordenar: com foto primeiro, depois por id desc (mais recente)
    grupo.sort((a, b) => {
      if (!!b.foto_url !== !!a.foto_url) return !!b.foto_url ? 1 : -1;
      return b.id > a.id ? 1 : -1;
    });

    const manter = grupo[0];
    const remover = grupo.slice(1);

    console.log(`MANTER  [${manter.id}] ${manter.nome} | ${manter.cargo} | ${manter.ano_eleicao} | foto: ${manter.foto_url ? 'sim' : 'nao'} | avaliacoes: ${manter.total_avaliacoes}`);
    for (const r of remover) {
      console.log(`  REMOVER [${r.id}] ${r.nome} | foto: ${r.foto_url ? 'sim' : 'nao'} | avaliacoes: ${r.total_avaliacoes}`);
      idsRemover.push(r.id);
    }
    console.log();
    totalRemover += remover.length;
  }

  console.log(`Total a remover: ${totalRemover} registros`);

  if (!apply) {
    console.log('\nDRY-RUN concluido. Rode com --apply para executar.\n');
    return;
  }

  // Reatribuir manifestacoes e avaliacoes do removido para o sobrevivente antes de excluir
  for (const grupo of duplicatas) {
    const manter = grupo[0];
    const remover = grupo.slice(1);
    for (const r of remover) {
      await prisma.manifestacao.updateMany({ where: { candidato_id: r.id }, data: { candidato_id: manter.id } });
      await prisma.avaliacao.updateMany({ where: { candidato_id: r.id }, data: { candidato_id: manter.id } });
    }
  }

  // Excluir duplicatas
  const { count } = await prisma.candidato.deleteMany({ where: { id: { in: idsRemover } } });
  console.log(`\nExcluidos: ${count} candidatos duplicados.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
