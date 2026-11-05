import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function validate() {
  try {
    console.log('🔍 Validando conexão com o banco...');
    const count = await prisma.campanha.count();
    console.log(`✅ Conexão estabelecida com sucesso! Total de campanhas: ${count}`);
    
    // Listar tabelas para confirmar integridade
    const tables = ['Campanha', 'Atributo', 'Candidato', 'Avaliacao'];
    console.log('\n📊 Status das Tabelas:');
    for (const table of tables) {
      // @ts-expect-error - TS não permite acesso dinâmico direto no cliente Prisma
      const tCount = await prisma[table.toLowerCase()].count();
      console.log(`- ${table}: ${tCount} registros`);
    }
  } catch (error) {
    console.error('❌ Falha na conexão:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

validate();
