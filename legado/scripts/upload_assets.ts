import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});
const BUCKET_NAME = 'candidatos';
const ASSETS_DIR = path.join(process.cwd(), 'public', 'candidatos');

async function ensureBucket() {
  try {
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
    
    if (error || !data) {
      console.log(`Criando bucket: ${BUCKET_NAME}...`);
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      });
      if (createError) {
        console.warn('Aviso: Erro ao criar bucket (pode já existir):', createError.message);
      }
    } else {
      console.log(`Bucket ${BUCKET_NAME} já existe.`);
    }
  } catch (err) {
    console.warn('Aviso: Falha ao verificar bucket, tentando upload direto...');
  }
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function uploadFiles() {
  console.log('Lendo arquivos locais...');
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`Erro: Diretório ${ASSETS_DIR} não encontrado.`);
    return;
  }
  
  const allFiles = getAllFiles(ASSETS_DIR);
  console.log(`Total de arquivos encontrados: ${allFiles.length}`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  const BATCH_SIZE = 15;
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (filePath) => {
      const relativePath = path.relative(ASSETS_DIR, filePath).replace(/\\/g, '/');
      const fileBuffer = fs.readFileSync(filePath);
      
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(relativePath, fileBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        if (error.message.includes('already exists')) {
          skippedCount++;
        } else {
          console.error(`Erro no arquivo ${relativePath}:`, error.message);
          errorCount++;
        }
      } else {
        successCount++;
      }
    }));

    if (i % 300 === 0) {
      console.log(`Progresso: ${i}/${allFiles.length} (${((i/allFiles.length)*100).toFixed(1)}%)...`);
    }
  }

  console.log('--- Resumo do Upload ---');
  console.log(`Sucesso: ${successCount}`);
  console.log(`Pulados: ${skippedCount}`);
  console.log(`Erros: ${errorCount}`);
}

async function main() {
  console.log('Iniciando migração de fotos para Supabase Storage (MS-2026)...');
  await ensureBucket();
  await uploadFiles();
  console.log('Migração finalizada!');
}

main().catch(console.error);
