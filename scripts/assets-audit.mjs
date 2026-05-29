import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

config({ path: '.env.local' });
config({ path: '.env' });

const prisma = new PrismaClient();
const assetsDir = path.join(process.cwd(), 'public', 'candidatos');

function toMb(value) {
  return Number((value / 1024 / 1024).toFixed(2));
}

function walkFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function fileNameFromFotoUrl(fotoUrl) {
  if (!fotoUrl) return null;
  if (fotoUrl.startsWith('/candidatos/')) return fotoUrl.split('/').pop() || null;

  try {
    const url = new URL(fotoUrl);
    if (url.pathname.includes('/storage/v1/object/public/candidatos/')) {
      return decodeURIComponent(url.pathname.split('/').pop() || '');
    }
  } catch {
    return null;
  }

  return null;
}

try {
  const files = walkFiles(assetsDir);
  const fileStats = files.map((file) => {
    const stat = fs.statSync(file);
    return {
      name: path.basename(file),
      size: stat.size,
    };
  });

  const localFiles = new Map(fileStats.map((file) => [file.name, file.size]));
  const totalSize = fileStats.reduce((acc, file) => acc + file.size, 0);

  const candidatos = await prisma.candidato.findMany({
    select: {
      id: true,
      foto_url: true,
      status: true,
    },
  });

  const withPhoto = candidatos.filter((item) => item.foto_url);
  const legacyRefs = withPhoto.filter((item) => item.foto_url?.startsWith('/candidatos/'));
  const remoteRefs = withPhoto.filter((item) => item.foto_url?.startsWith('http'));
  const referencedFiles = new Set(withPhoto.map((item) => fileNameFromFotoUrl(item.foto_url)).filter(Boolean));
  const missingLocalRefs = [...referencedFiles].filter((fileName) => !localFiles.has(fileName));
  const orphanLocalFiles = [...localFiles.keys()].filter((fileName) => !referencedFiles.has(fileName));

  const largestFiles = fileStats
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .map((file) => ({
      name: file.name,
      mb: toMb(file.size),
    }));

  const report = {
    generatedAt: new Date().toISOString(),
    localAssets: {
      directory: assetsDir,
      files: fileStats.length,
      totalMb: toMb(totalSize),
      orphanFiles: orphanLocalFiles.length,
      largestFiles,
    },
    databaseReferences: {
      candidatos: candidatos.length,
      withPhoto: withPhoto.length,
      legacyLocalPathRefs: legacyRefs.length,
      remoteUrlRefs: remoteRefs.length,
      referencedFileNames: referencedFiles.size,
      missingLocalFiles: missingLocalRefs.length,
    },
    deployment: {
      vercelIgnoreExpected: 'public/candidatos/**',
      recommendation: 'Manter fotos no Supabase Storage e evitar publicar public/candidatos na Vercel.',
    },
  };

  console.log(JSON.stringify(report, null, 2));
} finally {
  await prisma.$disconnect();
}
