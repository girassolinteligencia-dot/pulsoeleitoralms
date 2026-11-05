import { PrismaClient } from '@prisma/client';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });
const prisma = new PrismaClient();

async function vincularAtributos() {
  console.log('🔗 Vinculando atributos às campanhas...');

  // 1. Pegar todos os atributos existentes
  const atributos = await prisma.atributo.findMany();
  
  // 2. Pegar todas as campanhas de 2018 a 2024
  const campanhas = await prisma.campanha.findMany({
    where: {
      slug: { in: ['ms-2018', 'ms-2020', 'ms-2022', 'ms-2024', 'ms-2026'] }
    }
  });

  for (const campanha of campanhas) {
    console.log(`Processando: ${campanha.nome}...`);
    
    for (const atributo of atributos) {
      // Verificar se a relação já existe
      const existe = await prisma.campanhaAtributo.findFirst({
        where: {
          campanha_id: campanha.id,
          atributo_id: atributo.id,
        }
      });

      if (!existe) {
        await prisma.campanhaAtributo.create({
          data: {
            campanha_id: campanha.id,
            atributo_id: atributo.id,
          }
        });
      }
    }
  }

  console.log('✅ Atributos vinculados com sucesso!');
}

vincularAtributos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
