import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis do .env.local com override para garantir que usemos a URL correta
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

const prisma = new PrismaClient();

// Configurações de caminhos
const DATA_DIR = path.join(process.cwd(), 'prisma', 'data');
const PHOTOS_DIR = path.join(process.cwd(), 'public', 'candidatos');

async function importCandidatos() {
  console.log('🚀 Iniciando importação de candidatos...');

  // 1. Localizar todos os arquivos CSV de candidatos e inverter (mais recentes primeiro)
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.startsWith('consulta_nomes_cand_') && f.endsWith('.csv'))
    .sort()
    .reverse();

  for (const file of files) {
    const year = file.match(/\d{4}/)?.[0] || 'unknown';
    const campaignSlug = `ms-${year}`;
    console.log(`\n--- Processando Ano: ${year} (Arquivo: ${file}) ---`);

    // 2. Garantir que a campanha existe
    const campanha = await prisma.campanha.upsert({
      where: { slug: campaignSlug },
      update: {},
      create: {
        nome: `Eleições MS ${year}`,
        slug: campaignSlug,
      },
    });

    // 3. Ler o conteúdo do CSV (usando latin1 para lidar com acentos do TSE)
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'latin1');
    const lines = content.split('\n');
    const header = lines[0].split(';').map(h => h.replace(/"/g, ''));

    // Mapeamento de colunas baseado no cabeçalho do TSE
    const idx = {
      sq_cand: header.indexOf('SQ_CANDIDATO'),
      nome: header.indexOf('NM_CANDIDATO'),
      cargo: header.indexOf('DS_CARGO'),
      uf: header.indexOf('SG_UF'),
      ue: header.indexOf('NM_UE'),
      situacao: header.indexOf('DS_SITUACAO_CANDIDATURA'),
    };

    console.log(`Mapeamento: SQ=${idx.sq_cand}, Nome=${idx.nome}, Cargo=${idx.cargo}`);

    let count = 0;
    let photosCount = 0;

    // 4. Mapear fotos em memória para busca rápida
    const photosSet = new Set(fs.readdirSync(PHOTOS_DIR));
    
    const cellsList = lines.slice(1).map(line => line.split(';').map(c => c.replace(/"/g, '')));
    const dataWithPhotos = [];
    const dataWithoutPhotos = [];

    for (const cells of cellsList) {
      const sqCand = cells[idx.sq_cand];
      const nome = cells[idx.nome];
      const cargo = cells[idx.cargo];
      const uf = cells[idx.uf];
      const cidade = cells[idx.ue];

      if (!sqCand || !nome) continue;

      const photoName = `F${uf}${sqCand}_div.jpg`;
      const hasPhoto = photosSet.has(photoName);
      
      const item = {
        id: `cand-${sqCand}`,
        nome,
        cargo,
        cidade,
        foto_url: hasPhoto ? `/candidatos/${photoName}` : null,
        campanha_id: campanha.id,
      };

      if (hasPhoto) {
        dataWithPhotos.push(item);
        photosCount++;
      } else {
        dataWithoutPhotos.push(item);
      }
      count++;
    }

    // 6. Inserir primeiro quem tem foto (Alta Prioridade)
    console.log(`\n📸 Enviando ${dataWithPhotos.length} candidatos COM FOTO...`);
    await processBatch(dataWithPhotos);

    // 7. Opcional: Inserir quem não tem foto (Desativado para velocidade máxima)
    // console.log(`\n👥 Enviando ${dataWithoutPhotos.length} candidatos sem foto...`);
    // await processBatch(dataWithoutPhotos.slice(0, 500)); 
    
    console.log(`\n✅ Finalizado ${year}: ${count} processados (${photosCount} com foto).`);
  }

  console.log('\n✨ Importação concluída!');
}

async function processBatch(data: { id: string; nome: string; cargo: string; cidade: string; foto_url: string | null; campanha_id: string }[]) {
  const BATCH_SIZE = 1000;
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    
    // createMany é extremamente rápido no Postgres/Supabase
    await prisma.candidato.createMany({
      data: batch,
      skipDuplicates: true,
    });
    
    process.stdout.write('⚡');
  }
}

importCandidatos()
  .catch(e => {
    console.error('❌ Erro na importação:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
