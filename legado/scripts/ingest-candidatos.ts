import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando ingestão organizada de candidatos...');

  const dataPath = path.join(process.cwd(), 'data', 'candidatos.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Erro: Arquivo data/candidatos.json não encontrado.');
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf8');
  const candidatos = JSON.parse(rawData);

  console.log(`📦 Encontrados ${candidatos.length} candidatos para processar.`);

  for (const cand of candidatos) {
    console.log(`\n🔹 Processando: ${cand.nome} (${cand.cargo})`);

    const campanhaSlug = cand.campanha_slug || cand.campanha_id || 'ms-2026';
    const candidateId = `cand-${(cand.nome || 'unnamed').toLowerCase().replace(/\s+/g, '-')}-${(cand.cidade || 'generic').toLowerCase().replace(/\s+/g, '-')}`;

    // 1. Garantir que a campanha existe
    const campanha = await prisma.campanha.upsert({
      where: { slug: campanhaSlug },
      update: {},
      create: {
        nome: `Campanha ${campanhaSlug.toUpperCase()}`,
        slug: campanhaSlug,
        status: 'ativo'
      }
    });

    // 2. Upsert do candidato
    const candidato = await prisma.candidato.upsert({
      where: { 
        id: candidateId
      },
      update: {
        partido: cand.partido,
        numero: cand.numero,
        foto_url: cand.foto_url,
        cargo: cand.cargo,
        cidade: cand.cidade,
        status: cand.status || 'Ativo'
      },
      create: {
        id: candidateId,
        nome: cand.nome,
        partido: cand.partido,
        numero: cand.numero,
        cargo: cand.cargo,
        cidade: cand.cidade,
        foto_url: cand.foto_url,
        campanha_id: campanha.id,
        status: cand.status || 'Ativo',
        status_verificacao: true
      }
    });

    console.log(`✅ Candidato ${candidato.nome} sincronizado.`);
  }

  console.log('\n✨ Ingestão concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a ingestão:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
